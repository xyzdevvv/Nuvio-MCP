import { Autowired, Injectable } from '@Nuvio-MCP/di';
import {
  ClientAppContribution,
  Domain,
  IStatusBarService,
  StatusBarAlignment,
  StatusBarEntryAccessor,
  getIcon,
} from '@Nuvio-MCP/ide-core-browser';
import {
  BrowserConnectionCloseEvent,
  BrowserConnectionOpenEvent,
  CommandContribution,
  CommandRegistry,
  CommandService,
  OnEvent,
  Uri,
  WithEventBus,
} from '@Nuvio-MCP/ide-core-common';
import { MULTI_DIFF_SCHEME } from '@Nuvio-MCP/ide-editor/lib/common/multi-diff';

let executeCount = 0;

const TEST_MULTI_DIFF_COMMAND = 'testMultiDiffCommand';

@Injectable()
@Domain(ClientAppContribution, CommandContribution)
export class StatusBarContribution extends WithEventBus implements ClientAppContribution, CommandContribution {
  @Autowired(IStatusBarService)
  private statusBarService: IStatusBarService;

  @Autowired(CommandService)
  private readonly commandService: CommandService;

  private statusBarElement?: StatusBarEntryAccessor;

  private onDidConnectionChange(text: string | undefined, backgroundColor: string) {
    if (this.statusBarElement) {
      this.statusBarElement.update({
        text,
        backgroundColor,
        alignment: StatusBarAlignment.LEFT,
      });
    }
  }

  @OnEvent(BrowserConnectionCloseEvent)
  onDidDisConnect() {
    this.onDidConnectionChange('Disconnected', 'var(--kt-statusbar-offline-background)');
  }

  @OnEvent(BrowserConnectionOpenEvent)
  onDidConnected() {
    this.onDidConnectionChange(undefined, 'var(--button-background)');
  }

  registerCommands(commands: CommandRegistry) {
    commands.registerCommand(
      { id: TEST_MULTI_DIFF_COMMAND },
      {
        execute: () => this.openDiff(),
      },
    );
  }

  private openDiff() {
    this.commandService.executeCommand('_workbench.openMultiDiffEditor', {
      title: 'compareTitle',
      multiDiffSourceUri: Uri.from({
        scheme: MULTI_DIFF_SCHEME,
        path: 'test',
      }),
      resources: [
        {
          // NOTE: 仅用于演示用法，请修改成你本机的文件路径
          originalUri: Uri.file(''),
          modifiedUri: Uri.file(''),
        },
      ].concat(
        executeCount++ === 0
          ? []
          : [
              {
                originalUri: Uri.file(''),
                modifiedUri: Uri.file(''),
              },
            ],
      ),
    });
  }

  onDidStart() {
    if (!this.statusBarElement) {
      this.statusBarElement = this.statusBarService.addElement('Nuvio-MCP', {
        backgroundColor: 'var(--button-background)',
        color: 'var(--button-foreground)',
        tooltip: 'Nuvio-MCP',
        alignment: StatusBarAlignment.LEFT,
        iconClass: getIcon('code'),
        priority: Infinity,
      });
      this.statusBarService.addElement('Nuvio-MCP', {
        tooltip: 'Test MultiDiff Logic, Press twice will open multi-diff editor with two files',
        alignment: StatusBarAlignment.LEFT,
        text: 'MultiDiff Test',
        priority: 10,
        command: TEST_MULTI_DIFF_COMMAND,
      });
    }
  }
}
