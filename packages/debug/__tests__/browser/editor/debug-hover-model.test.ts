import { Disposable } from '@Nuvio-MCP/ide-core-common';
import { DebugHoverModel } from '@Nuvio-MCP/ide-debug/lib/browser/editor/debug-hover-model';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';

describe('Debug Hover Model', () => {
  const mockInjector = createBrowserInjector([]);
  let debugHoverModel: DebugHoverModel;
  const mockRoot = {
    watcher: {
      on: jest.fn(() => Disposable.create(() => {})),
    },
    ensureLoaded: jest.fn(),
  } as any;

  beforeAll(() => {
    debugHoverModel = mockInjector.get(DebugHoverModel, [mockRoot]);
  });

  it('should have enough API', () => {
    expect(typeof debugHoverModel.init).toBe('function');
    expect(mockRoot.watcher.on).toHaveBeenCalledTimes(3);
  });

  it('init method should be work', () => {
    debugHoverModel.init(mockRoot);
    expect(mockRoot.watcher.on).toHaveBeenCalledTimes(6);
  });
});
