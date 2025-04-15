/* eslint-disable no-console */
import { IViewportRange, Terminal } from '@xterm/xterm';

import { Injector } from '@Nuvio-MCP/di';
import { LayoutState } from '@Nuvio-MCP/ide-core-browser/lib/layout/layout-state';
import { Disposable } from '@Nuvio-MCP/ide-core-common';
import { CommandService, CommandServiceImpl } from '@Nuvio-MCP/ide-core-common/lib/command';
import { mockService } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { IDialogService } from '@Nuvio-MCP/ide-overlay/lib/common';
import { IStatusBarService } from '@Nuvio-MCP/ide-status-bar';
import { StatusBarService } from '@Nuvio-MCP/ide-status-bar/lib/browser/status-bar.service';
import { ITerminalProcessPath } from '@Nuvio-MCP/ide-terminal-next';
import { IWorkspaceStorageService } from '@Nuvio-MCP/ide-workspace/lib/common';

import { TerminalLink } from '../../lib/browser/links/link';
import { ITerminalHoverManagerService } from '../../lib/common';
import { convertBufferRangeToViewport, convertLinkRangeToBuffer } from '../../src/browser/links/helpers';
import { TerminalHoverManagerService } from '../../src/browser/terminal.hover.manager';

import { createBufferLineArray } from './utils';

const mockData = [
  {
    extensionIdentifier: 'vscode-samples.vscode-terminal-api-example',
    collection: [['FOO', { value: 'BAR', type: 1 }]],
  },
];

describe('terminal.environment.service', () => {
  const injector = new Injector();
  let terminalHoverManagerService: TerminalHoverManagerService;
  const modifierDownCallback = () => {};
  const modifierUpCallback = () => {};

  beforeAll(() => {
    injector.addProviders(
      {
        token: IStatusBarService,
        useClass: StatusBarService,
      },
      {
        token: IDialogService,
        useValue: {},
      },
      {
        token: CommandService,
        useClass: CommandServiceImpl,
      },
      {
        token: ITerminalHoverManagerService,
        useClass: TerminalHoverManagerService,
      },
      {
        token: ITerminalProcessPath,
        useValue: {
          getEnv: () => ({}),
        },
      },
      {
        token: IWorkspaceStorageService,
        useValue: {
          getData: () => JSON.stringify(mockData),
          setData: () => {},
        },
      },
      {
        token: LayoutState,
        useValue: mockService({
          getState: () => ({}),
        }),
      },
    );

    terminalHoverManagerService = injector.get(ITerminalHoverManagerService);
  });

  it('TerminalHoverManagerService#init', async () => {
    const _xterm = new Terminal({ allowProposedApi: true });
    const lines = createBufferLineArray([
      { text: 'AA http://t', width: 11 },
      { text: '.com/f/', width: 8 },
    ]);

    const startLine = 0;
    const bufferRange = convertLinkRangeToBuffer(
      lines,
      _xterm.cols,
      {
        startColumn: 0,
        startLineNumber: 1,
        endColumn: 1,
        endLineNumber: 1,
      },
      startLine,
    );

    const matchingText = 'test';
    const handler = (_: Event, text: string) => console.log(text);
    const activateLink = (handler) => (event: Event | undefined, text: string) => {
      handler(event, text);
    };
    const _tooltipCallback = (
      link: TerminalLink,
      viewportRange: IViewportRange,
      modifierDownCallback?: () => void,
      modifierUpCallback?: () => void,
    ) => {
      console.log('test', link, viewportRange, modifierDownCallback, modifierUpCallback);
      return Disposable.create(() => {
        console.log('dispose');
      });
    };

    const link: TerminalLink = injector.get(TerminalLink, [
      _xterm,
      bufferRange,
      matchingText,
      _xterm.buffer.active.viewportY,
      activateLink(handler),
      _tooltipCallback,
      true,
      'text label',
    ]);

    const _viewportY = 10; // random value
    const viewportRange: IViewportRange = convertBufferRangeToViewport(bufferRange, _viewportY);
    const cellDimensions = {
      width: 2,
      height: 2,
    };
    const terminalDimensions = {
      width: _xterm.cols,
      height: _xterm.rows,
    };
    const boundingClientRect = {
      bottom: 1375,
      height: 1375,
      left: 0,
      right: 2560,
      top: 0,
      width: 2560,
      x: 0,
      y: 0,
    };

    terminalHoverManagerService.setHoverOverlay(document.createElement('div'));
    terminalHoverManagerService.showHover(
      {
        viewportRange,
        cellDimensions,
        terminalDimensions,
        boundingClientRect,
        modifierDownCallback,
        modifierUpCallback,
      },
      'test',
      (text) => link.activate(undefined, text),
    );
  });
});
