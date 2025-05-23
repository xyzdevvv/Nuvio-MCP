import throttle from 'lodash/throttle';

import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { DisposableCollection, Emitter, Event, ILogger, MessageType, localize } from '@Nuvio-MCP/ide-core-common';
import { IThemeService } from '@Nuvio-MCP/ide-theme';
import { DebugProtocol } from '@Nuvio-MCP/vscode-debugprotocol/lib/debugProtocol';

import { IDebugConsoleSession, IDebugSession } from '../../../common';
import { handleANSIOutput } from '../../debug-ansi-handle';
import { LinkDetector } from '../../debug-link-detector';
import { DebugSession } from '../../debug-session';
import { AnsiConsoleNode, DebugConsoleNode, DebugVariableContainer, ExpressionContainer } from '../../tree';

import { DebugConsoleTreeModel } from './debug-console-model';

type ConsoleNodes = DebugConsoleNode | AnsiConsoleNode | DebugVariableContainer;

@Injectable({ multiple: true })
export class DebugConsoleSession implements IDebugConsoleSession {
  @Autowired(ILogger)
  private logger: ILogger;

  @Autowired(LinkDetector)
  private linkDetector: LinkDetector;

  @Autowired(IThemeService)
  protected readonly themeService: IThemeService;

  // 缓冲未完成的append进来的内容
  protected uncompletedItemContent: string | undefined;

  protected readonly toDispose = new DisposableCollection();

  protected fireDidChange: any = throttle(() => this.onDidChangeEmitter.fire(), 50);

  private onDidChangeEmitter: Emitter<void> = new Emitter();

  constructor(@Optional() private session: DebugSession, @Optional() private treeModel: DebugConsoleTreeModel) {
    this.init();
  }

  /**
   * 这里需要将 tree 的 children 做扁平处理
   * 因为当用户在控制台输入表达式求值时，得到的结果如果是对象，也需要把这个对象的 children 给扔到 DebugConsoleRoot.updatePresetChildren 方法里去
   * 否则会出现，对象展开的状态下，有新的日志内容发送过来时，对象的所有子属性都消失的情况，
   */
  resolveChildren() {
    const flattenedBranch = this.treeModel.root.flattenedBranch || [];
    return flattenedBranch.map((id: number) => this.treeModel.root.getTreeNodeById(id)) as ConsoleNodes[];
  }

  getLastItem(): ConsoleNodes | undefined {
    const { flattenedBranch } = this.treeModel.root;
    const lastBranch = flattenedBranch?.length ? flattenedBranch[flattenedBranch.length - 1] : undefined;
    return lastBranch ? (this.treeModel.root.getTreeNodeById(lastBranch) as ConsoleNodes) : undefined;
  }

  init() {
    this.toDispose.push(this.session.on('output', (event) => this.logOutput(this.session, event)));
  }

  addChildSession(child: IDebugSession): void {
    this.toDispose.push(child.on('output', (event) => this.logOutput(child as DebugSession, event)));
  }

  get onDidChange(): Event<void> {
    return this.onDidChangeEmitter.event;
  }

  clear(): void {
    this.fireDidChange();
  }

  protected async logOutput(session: DebugSession, event: DebugProtocol.OutputEvent): Promise<void> {
    // [2J is the ansi escape sequence for clearing the display http://ascii-table.com/ansi-escape-sequences.php
    const clearAnsiSequence = '\u001b[2J';
    const body = event.body;
    const { category, variablesReference, source, line } = body;
    if (!this.treeModel) {
      return;
    }
    const severity =
      category === 'stderr'
        ? MessageType.Error
        : category === 'stdout'
        ? MessageType.Info
        : category === 'console'
        ? MessageType.Warning
        : MessageType.Info;
    if (category === 'telemetry') {
      this.logger.debug(`telemetry/${event.body.output}`, event.body.data);
      return;
    }
    if (variablesReference) {
      const expression = new DebugConsoleNode(
        {
          session,
          variablesReference,
          source,
          line,
        },
        '',
        this.treeModel?.root as ExpressionContainer,
      );
      await expression.evaluate();
      this.treeModel.root.insertItem(expression);
    } else if (typeof body.output === 'string') {
      let output = body.output;
      if (output.indexOf(clearAnsiSequence) >= 0) {
        this.clearConsole();
        await this.insertItemWithAnsi(localize('debug.console.consoleCleared'), MessageType.Info);
        output = output.substring(output.lastIndexOf(clearAnsiSequence) + clearAnsiSequence.length);
      }
      const previousItem = this.getLastItem();
      /**
       * 如果上一次输出结尾没有换行符并且输出类型（MessageType）一致
       * 则将接下来的输出拼接至上一次输出后
       */
      if (
        previousItem &&
        !previousItem.description.endsWith('\n') &&
        !previousItem.description.endsWith('\r\n') &&
        (previousItem as AnsiConsoleNode).severity === severity
      ) {
        this.treeModel.root.unlinkItem(previousItem);
        await this.insertItemWithAnsi(previousItem.description + body.output, severity, source, line);
      } else {
        await this.insertItemWithAnsi(body.output, severity, source, line);
      }
    }

    this.fireDidChange();
  }

  private async clearConsole() {
    const items = this.treeModel.root.flattenedBranch?.map((id) => this.treeModel.root.getTreeNodeById(id));
    if (!items) {
      return;
    }
    for (const item of items) {
      this.treeModel.root.unlinkItem(item as AnsiConsoleNode);
    }
  }

  private async insertItemWithAnsi(
    output: string,
    severity?: MessageType,
    source?: DebugProtocol.Source,
    line?: string | number,
  ) {
    const ansiNode = await handleANSIOutput(output, this.linkDetector, this.themeService, undefined);
    this.treeModel.root.insertItem(
      new AnsiConsoleNode(output, this.treeModel?.root, this.linkDetector, ansiNode, severity, source, line),
    );
  }

  async execute(value: string): Promise<void> {
    this.treeModel.root.insertItem(
      new AnsiConsoleNode(value, this.treeModel.root, this.linkDetector, undefined, MessageType.Info),
    );
    const expression = new DebugConsoleNode(
      { session: this.session },
      value,
      this.treeModel?.root as ExpressionContainer,
    );
    await expression.evaluate();
    this.treeModel.root.insertItem(expression);
    this.fireDidChange();
  }

  append(value: string): void {
    if (!value) {
      return;
    }

    const lastItem = this.resolveChildren().slice(-1)[0];
    if (lastItem instanceof AnsiConsoleNode && lastItem.description === this.uncompletedItemContent) {
      this.resolveChildren().pop();
      this.uncompletedItemContent += value;
    } else {
      this.uncompletedItemContent = value;
    }

    this.treeModel.root.insertItem(
      new AnsiConsoleNode(
        this.uncompletedItemContent,
        this.treeModel?.root,
        this.linkDetector,
        undefined,
        MessageType.Info,
      ),
    );
    this.fireDidChange();
  }

  appendLine(value: string): void {
    this.treeModel.root.insertItem(
      new AnsiConsoleNode(value, this.treeModel?.root, this.linkDetector, undefined, MessageType.Info),
    );
    this.fireDidChange();
  }
}
