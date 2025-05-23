import { Autowired, Injectable } from '@Nuvio-MCP/di';
import {
  Disposable,
  IDisposable,
  IStringDictionary,
  Mode,
  PreferenceService,
  QuickOpenItem,
  QuickOpenService,
  Uri,
  formatLocalize,
  getIcon,
  isString,
  localize,
} from '@Nuvio-MCP/ide-core-browser';
import {
  Emitter,
  Event,
  IProblemMatcherRegistry,
  IProblemPatternRegistry,
  ITaskDefinitionRegistry,
  platform,
} from '@Nuvio-MCP/ide-core-common';
import { OutputChannel } from '@Nuvio-MCP/ide-output/lib/browser/output.channel';
import { OutputService } from '@Nuvio-MCP/ide-output/lib/browser/output.service';
import { ITerminalClient } from '@Nuvio-MCP/ide-terminal-next/lib/common/client';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { ITaskProvider, ITaskService, ITaskSummary, ITaskSystem, WorkspaceFolderTaskResult } from '../common';
import {
  ConfiguringTask,
  ContributedTask,
  CustomTask,
  KeyedTaskIdentifier,
  Task,
  TaskEvent,
  TaskIdentifier,
  TaskSet,
} from '../common/task';

import { ValidationState, ValidationStatus } from './parser';
import { IProblemReporter, createCustomTask, parse } from './task-config';

class ProblemReporter implements IProblemReporter {
  private _validationStatus: ValidationStatus;

  constructor(private _outputChannel: OutputChannel) {
    this._validationStatus = new ValidationStatus();
  }

  public info(message: string): void {
    this._validationStatus.state = ValidationState.Info;
    this._outputChannel.append(message + '\n');
  }

  public warn(message: string): void {
    this._validationStatus.state = ValidationState.Warning;
    this._outputChannel.append(message + '\n');
  }

  public error(message: string): void {
    this._validationStatus.state = ValidationState.Error;
    this._outputChannel.append(message + '\n');
  }

  public fatal(message: string): void {
    this._validationStatus.state = ValidationState.Fatal;
    this._outputChannel.append(message + '\n');
  }

  public get status(): ValidationStatus {
    return this._validationStatus;
  }
}

@Injectable()
export class TaskService extends Disposable implements ITaskService {
  @Autowired(OutputService)
  protected readonly outputService: OutputService;

  @Autowired(IWorkspaceService)
  protected readonly workspaceService: IWorkspaceService;

  @Autowired(QuickOpenService)
  protected readonly quickOpenService: QuickOpenService;

  @Autowired(PreferenceService)
  protected readonly preferences: PreferenceService;

  @Autowired(ITaskSystem)
  protected readonly taskSystem: ITaskSystem;

  @Autowired(ITaskDefinitionRegistry)
  protected readonly taskDefinitionRegistry: ITaskDefinitionRegistry;

  @Autowired(IProblemMatcherRegistry)
  problemMatcher: IProblemMatcherRegistry;

  @Autowired(IProblemPatternRegistry)
  problemPattern: IProblemPatternRegistry;

  private _onDidStateChange: Emitter<TaskEvent> = new Emitter();
  public onDidStateChange: Event<TaskEvent> = this._onDidStateChange.event;

  private _onDidRegisterTaskProvider: Emitter<string> = new Emitter();
  public onDidRegisterTaskProvider: Event<string> = this._onDidRegisterTaskProvider.event;

  private providerHandler = 0;

  private _outputChannel: OutputChannel;

  private _workspaceFolders: Uri[];

  private runningTasks: Map<string, Task | ConfiguringTask> = new Map();

  private providers: Map<number, ITaskProvider>;
  private providerTypes: Map<string, number>;

  constructor() {
    super();
    this.providers = new Map();
    this.providerTypes = new Map();
    this.addDispose([
      this.taskSystem.onDidStateChange((e) => this._onDidStateChange.fire(e)),
      this.taskSystem.onDidBackgroundTaskBegin((e) => this._onDidStateChange.fire(e)),
      this.taskSystem.onDidBackgroundTaskEnded((e) => this._onDidStateChange.fire(e)),
      this.taskSystem.onDidProblemMatched((e) => this._onDidStateChange.fire(e)),
    ]);
  }

  get outputChannel() {
    if (!this._outputChannel) {
      this._outputChannel = this.outputService.getChannel(localize('task.outputchannel.name'));
    }
    return this._outputChannel;
  }

  private get workspaceFolders() {
    if (!this._workspaceFolders) {
      this.tryGetWorkspaceFolders();
    }
    return this._workspaceFolders;
  }

  private tryGetWorkspaceFolders() {
    this._workspaceFolders = this.workspaceService.tryGetRoots().map((stat) => Uri.parse(stat.uri));
  }

  public async runTaskCommand() {
    const groupedTaskSet: TaskSet[] = await this.getGroupedTasks();
    const workspaceTasks = await this.getWorkspaceTasks(groupedTaskSet);
    const [workspaces, grouped] = this.combineQuickItems(groupedTaskSet, workspaceTasks);
    this.quickOpenService.open(
      {
        onType: (lookFor: string, acceptor) => acceptor([...workspaces, ...grouped]),
      },
      { placeholder: formatLocalize('TaskService.pickRunTask') },
    );
  }

  public run(task: Task) {
    return this.runTask(task);
  }

  public async attach(taskId: string, terminal: ITerminalClient) {
    if (this.runningTasks.has(taskId)) {
      return;
    }

    const [, , , taskType] = taskId.split(',');
    if (!taskType) {
      return;
    }

    if (this.providerTypes.has(taskType)) {
      const task = await this.getTask(this.workspaceFolders[0], taskId);
      if (task) {
        this.taskSystem.attach(task, terminal);
        this.runningTasks.set(taskId, task);
      }
    } else {
      // wait for task provider to be registered
      const disposable = this._onDidRegisterTaskProvider.event(async (e) => {
        if (e === taskType) {
          const task = await this.getTask(this.workspaceFolders[0], taskId);
          if (task) {
            this.taskSystem.attach(task, terminal);
            this.runningTasks.set(taskId, task);
            disposable.dispose();
          }
        }
      });
    }
  }

  public async terminateTask(taskId: string) {
    const activeTasks = this.taskSystem.getActiveTasks();
    for (const t of activeTasks) {
      if (t._id === taskId) {
        await this.taskSystem.terminate(t);
      }
    }
  }

  public getTask(
    workspaceFolder: Uri,
    identifier: string | TaskIdentifier,
    compareId = false,
  ): Promise<Task | undefined> {
    const key: string | KeyedTaskIdentifier | undefined = !isString(identifier)
      ? this.taskDefinitionRegistry.createTaskIdentifier(identifier, console)
      : identifier;

    if (key === undefined) {
      return Promise.resolve(undefined);
    }

    return this.getWorkspaceGroupedTasks(workspaceFolder).then((taskMap) => {
      if (!taskMap) {
        return Promise.resolve(undefined);
      }
      const tasks = taskMap.get(workspaceFolder.toString());
      if (!tasks) {
        return Promise.resolve(undefined);
      }
      for (const task of tasks!) {
        if (task.matches(key, compareId)) {
          return task;
        }
        if (task._id === identifier) {
          return task;
        }
        if (task._label === identifier) {
          return task;
        }
      }
    });
  }

  private async runTask(task: Task | ConfiguringTask): Promise<ITaskSummary> {
    const result = await this.taskSystem.run(task);

    result.promise.then((res) => {
      if (this.runningTasks.has(task._id)) {
        this.runningTasks.delete(task._id);
      }
      this.outputChannel.appendLine(`Task ${task._label} done, exit code ${res.exitCode}`);
    });

    this.runningTasks.set(task._id, task);

    return Promise.resolve(result.promise);
  }

  public async tasks(filter): Promise<Task[]> {
    const workspaceTasks = await this.getWorkspaceGroupedTasks();
    const result: Task[] = [];
    for (const taskMap of workspaceTasks.values()) {
      for (const task of taskMap) {
        if (filter && filter.type && task.getDefinition()?.type === filter.type) {
          result.push(task);
        }
        continue;
      }
    }
    return result;
  }

  private async getWorkspaceGroupedTasks(folder: Uri = this.workspaceFolders[0]): Promise<Map<string, Task[]>> {
    const contributedTaskSet = await this.getGroupedTasks();
    const workspaceTasks = await this.getWorkspaceTasks(contributedTaskSet);
    const result: Array<CustomTask | ContributedTask | Task> = [];
    for (const contributed of contributedTaskSet) {
      if (contributed.tasks && contributed.tasks.length > 0) {
        result.push(...contributed.tasks);
      }
    }

    const tasks = workspaceTasks?.get(folder.toString());
    if (tasks && tasks.set) {
      result.push(...tasks.set.tasks);
    }
    const taskMap = new Map();
    taskMap.set(folder.toString(), result);
    return taskMap;
  }

  private async getGroupedTasks(): Promise<TaskSet[]> {
    const valideTaskTypes: { [prop: string]: boolean } = {};
    for (const defintion of this.taskDefinitionRegistry.all()) {
      valideTaskTypes[defintion.taskType] = true;
    }
    valideTaskTypes['shell'] = true;
    valideTaskTypes['process'] = true;
    const result: TaskSet[] = [];
    for (const [, provider] of this.providers) {
      const value = await provider.provideTasks(valideTaskTypes);
      result.push(value);
    }
    return result;
  }

  private toQuickOpenItem = (task: Task | ConfiguringTask): QuickOpenItem =>
    new QuickOpenItem({
      label: task._label || '',
      detail:
        task instanceof ContributedTask
          ? `${task.command.name || ''} ${task.command.args ? task.command.args?.join(' ') : ''}`
          : undefined,
      run: (mode: Mode) => {
        if (mode === Mode.OPEN) {
          this.runTask(task);
          return true;
        }
        return false;
      },
    });

  private toQuickOpenGroupItem(showBorder: boolean, run, type?: string): QuickOpenItem {
    return new QuickOpenItem({
      groupLabel: showBorder ? formatLocalize('task.contribute') : undefined,
      run,
      showBorder,
      label: type,
      value: { type, grouped: true },
      iconClass: getIcon('folder'),
    });
  }

  private combineQuickItems(
    contributedTaskSet: TaskSet[],
    workspaceTasks: Map<string, WorkspaceFolderTaskResult> | undefined,
  ) {
    const groups: QuickOpenItem[] = [];
    const workspace: QuickOpenItem[] = [];
    let showBorder = true;
    for (const taskSet of contributedTaskSet) {
      const run = (mode: Mode) => {
        if (mode === Mode.OPEN) {
          this.quickOpenService.open({
            onType: (lookFor, acceptor) => {
              if (taskSet.tasks.length === 0) {
                return acceptor([
                  new QuickOpenItem({
                    value: 'none',
                    label: formatLocalize('task.cannotFindTask', taskSet.type),
                    run: (mode: Mode) => {
                      if (mode === Mode.OPEN) {
                        return true;
                      }
                      return false;
                    },
                  }),
                ]);
              }
              return acceptor(taskSet.tasks.map(this.toQuickOpenItem));
            },
          });
          return false;
        }
        return true;
      };
      const groupItem = this.toQuickOpenGroupItem(showBorder, run, taskSet.type);
      groups.push(groupItem);
      showBorder = false;
    }
    if (workspaceTasks) {
      for (const taskSet of workspaceTasks.values()) {
        if (taskSet.configurations?.byIdentifier) {
          Object.keys(taskSet.configurations?.byIdentifier).forEach((t) => {
            const task = taskSet.configurations?.byIdentifier[t];
            workspace.push(this.toQuickOpenItem(task!));
          });
        }

        if (taskSet.set && taskSet.set.tasks.length > 0) {
          for (const task of taskSet.set.tasks) {
            workspace.push(this.toQuickOpenItem(task));
          }
        }
      }
    }

    return [workspace, groups];
  }

  private async getWorkspaceTasks(
    groupedTaskSet: TaskSet[],
  ): Promise<Map<string, WorkspaceFolderTaskResult> | undefined> {
    return this.updateWorkspaceTasks(groupedTaskSet);
  }

  public updateWorkspaceTasks(groupedTaskSet: TaskSet[]): Promise<Map<string, WorkspaceFolderTaskResult> | undefined> {
    if (this.workspaceFolders.length === 0) {
      return Promise.resolve(new Map<string, WorkspaceFolderTaskResult>());
    } else if (this.workspaceFolders.length === 1) {
      /**
       * 由于 registerSchema 不支持 **\/tasks.json 通配符
       * 多 workspace 下无法默认从 preferences 获取到 tasks.json
       */
      return this.computeWorkspaceFolderTasks(this.workspaceFolders[0], groupedTaskSet).then((configuringTasks) => {
        const taskMap = new Map<string, WorkspaceFolderTaskResult>();
        taskMap.set(this.workspaceFolders[0].toString(), configuringTasks);
        return taskMap;
      });
    } else {
      return Promise.resolve(undefined);
      // TODO 多工作区支持
    }
  }

  private computeWorkspaceFolderTasks(folderUri: Uri, groupedTaskSet: TaskSet[]): Promise<WorkspaceFolderTaskResult> {
    return new Promise(async (resolve) => {
      const tasksConfig = this.preferences.get<{ version: string; tasks: any[] }>('tasks');
      const contributedTask = new Map<string, Task>();
      for (const taskSet of groupedTaskSet) {
        for (const contributed of taskSet.tasks) {
          if (!ContributedTask.is(contributed)) {
            continue;
          }
          contributedTask.set(contributed.defines._key, contributed);
        }
      }
      if (tasksConfig && tasksConfig.tasks) {
        let customizedTasks: { byIdentifier: IStringDictionary<ConfiguringTask> } | undefined;
        const taskSet: CustomTask[] = [];
        let hasErrors = false;
        const problemReporter = new ProblemReporter(this.outputChannel);
        const parseResult = parse(
          { uri: folderUri, name: folderUri.path, index: 0 },
          platform,
          tasksConfig,
          problemReporter,
          this.taskDefinitionRegistry,
          this.problemMatcher,
          this.problemPattern,
        );
        if (!parseResult.validationStatus.isOK()) {
          hasErrors = true;
          this.showOutput();
        }
        if (parseResult.configured && parseResult.configured.length > 0) {
          customizedTasks = {
            byIdentifier: Object.create(null),
          };
          for (const task of parseResult.configured) {
            customizedTasks.byIdentifier[task.configures._key] = task;
          }
        }
        taskSet.push(...parseResult.custom);
        /**
         * Converter configuringTask to customTask
         */
        if (customizedTasks && customizedTasks.byIdentifier) {
          Object.keys(customizedTasks.byIdentifier).forEach((key) => {
            if (contributedTask.has(key)) {
              const customTask = createCustomTask(
                contributedTask.get(key) as ContributedTask,
                customizedTasks!.byIdentifier[key],
              );
              // @ts-ignore
              customizedTasks.byIdentifier[key] = customTask;
            }
          });
        }
        resolve({
          workspaceFolder: { uri: folderUri, name: folderUri.path, index: 0 },
          set: { tasks: taskSet },
          configurations: customizedTasks,
          hasErrors,
        });
      } else {
        resolve({
          workspaceFolder: { uri: folderUri, name: folderUri.path, index: 0 },
          set: { tasks: [] },
          configurations: { byIdentifier: {} },
          hasErrors: false,
        });
      }
    });
  }

  protected showOutput(): void {
    this.outputChannel.appendLine('There are task errors. See the output for details.');
  }

  public rerunLastTask() {
    return this.taskSystem.rerun();
  }

  public registerTaskProvider(provider: ITaskProvider, type: string): IDisposable {
    const handler = (this.providerHandler += 1);
    this.providers.set(handler, provider);
    this.providerTypes.set(type, handler);
    this._onDidRegisterTaskProvider.fire(type);

    return {
      dispose: () => {
        this.providers.delete(handler);
        this.providerTypes.delete(type);
      },
    };
  }
}
