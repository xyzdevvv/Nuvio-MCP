import { IContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import { ICtxMenuRenderer } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { AbstractContextMenuService } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { URI } from '@Nuvio-MCP/ide-core-common';
import { Disposable } from '@Nuvio-MCP/ide-core-common';
import { DebugStackFrame } from '@Nuvio-MCP/ide-debug/lib/browser/model';
import { DebugCallStackService } from '@Nuvio-MCP/ide-debug/lib/browser/view/frames/debug-call-stack.service';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { ContextKeyService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/contextkey/browser/contextKeyService';
import { IContextKeyServiceTarget } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/contextkey/common/contextkey';

describe('Debug Call Frames Service', () => {
  const mockInjector = createBrowserInjector([]);
  let debugCallStackService: DebugCallStackService;

  const mockCtxMenuRenderer = {
    show: jest.fn(),
  } as any;

  const mockContextKeyService = {
    createScoped: jest.fn((target?: IContextKeyServiceTarget | ContextKeyService | undefined) => mockContextKeyService),
    createKey: jest.fn(() => ({
      set: jest.fn(),
      reset: jest.fn(),
    })),
    contextKeyScoped: jest.fn(),
  } as any;

  const mockAbstractContextMenuService = {
    createMenu: jest.fn(() => ({
      getMergedMenuNodes: jest.fn(),
      dispose: jest.fn(() => Disposable.create(() => {})),
    })),
  } as any;

  beforeAll(() => {
    mockInjector.overrideProviders({
      token: IContextKeyService,
      useValue: mockContextKeyService,
    });
    mockInjector.overrideProviders({
      token: ICtxMenuRenderer,
      useValue: mockCtxMenuRenderer,
    });
    mockInjector.overrideProviders({
      token: AbstractContextMenuService,
      useValue: mockAbstractContextMenuService,
    });
    debugCallStackService = mockInjector.get(DebugCallStackService);
  }),
    it('handleContextMenu method should be work', () => {
      const mockNode: DebugStackFrame = {
        source: {
          uri: URI.file('/test'),
        },
        session: {
          id: '1',
        },
        thread: {
          id: '2',
        },
        raw: {
          id: '3',
        },
      } as any;
      const mockEvent = {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        nativeEvent: {
          x: 1,
          y: 1,
        },
      } as any;
      debugCallStackService.handleContextMenu(mockEvent, mockNode);
      expect(mockCtxMenuRenderer.show).toHaveBeenCalledTimes(1);
      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
    });
});
