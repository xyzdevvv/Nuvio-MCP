import { URI } from '@Nuvio-MCP/ide-core-browser';
import { DebugSource } from '@Nuvio-MCP/ide-debug/lib/browser/model';
import { DebugProtocol } from '@Nuvio-MCP/vscode-debugprotocol/lib/debugProtocol';

describe('DebugSource Model', () => {
  describe('DebugSource should be work after init', () => {
    // init and mock api
    const sourceUri = 'file://userhome/debug.ts';
    let sessions;
    let workbenchEditorService;
    let labelProvider;
    let modelManager;
    let fileSystem;
    let model;

    let debugSource: DebugSource;
    const raw: DebugProtocol.Source = {
      name: 'test',
      path: sourceUri,
      sourceReference: 0,
      presentationHint: 'normal',
      origin: '',
      sources: [],
      adapterData: null,
      checksums: [],
    };

    beforeEach(() => {
      workbenchEditorService = {
        open: jest.fn(),
      } as any;
      labelProvider = {
        getName: jest.fn(() => 'labelName'),
        getLongName: jest.fn(() => 'labelLongName'),
      } as any;
      modelManager = {
        resolve: jest.fn(() => [model]),
      } as any;
      fileSystem = {
        setContent: jest.fn(),
      } as any;
      sessions = {
        sendRequest: jest.fn(() => ({
          body: {
            content: '',
          },
        })),
      } as any;
      model = {
        focusStackFrame: jest.fn(),
      } as any;
      debugSource = new DebugSource(sessions, labelProvider, modelManager, workbenchEditorService, fileSystem);
      debugSource.update({ raw });
    });

    afterEach(() => {
      workbenchEditorService.open.mockReset();
      sessions.sendRequest.mockReset();
      modelManager.resolve.mockReset();
      model.focusStackFrame.mockReset();
      fileSystem.setContent.mockReset();
      labelProvider.getName.mockReset();
    });

    it('Should have enough values', () => {
      expect(debugSource.uri).toEqual(new URI(sourceUri));
      expect(debugSource.inMemory).toBe(false);
      expect(debugSource.name).toBe('labelName');
      expect(debugSource.longName).toBe('labelLongName');
    });

    it('Memory file should be work', () => {
      const memoryFile = new URI('test.js').withScheme(DebugSource.SCHEME);
      const newRaw = {
        ...raw,
        path: memoryFile.toString(),
      };
      debugSource.update({ raw: newRaw });
      expect(debugSource.uri.toString()).toBe(memoryFile.toString());
      expect(debugSource.inMemory).toBe(true);
    });

    it('Load source should be work', async () => {
      await debugSource.load();
      expect(sessions.sendRequest).toHaveBeenCalledWith('source', {
        sourceReference: raw.sourceReference,
        source: raw,
      });
    });

    it('Open source should be work while file is memory file', async () => {
      const memoryFile = new URI('test.js').withScheme(DebugSource.SCHEME);
      const newRaw = {
        ...raw,
        path: memoryFile.toString(),
      };
      debugSource.update({ raw: newRaw });
      await debugSource.open({});
      expect(fileSystem.setContent).toHaveBeenCalledWith(
        {
          uri: memoryFile.toString(),
          lastModification: 0,
        },
        '',
      );
    });

    it('Open source should be work while there has frame', async () => {
      const frame = {
        raw: {
          line: 1,
          column: 1,
        },
        thread: {
          currentFrame: {},
        },
      };
      await debugSource.open({}, frame as any);
      expect(workbenchEditorService.open).toHaveBeenCalledTimes(1);
      expect(model.focusStackFrame).toHaveBeenCalledWith();
    });

    it('Open source should be work with no frame and no memory file', async () => {
      await debugSource.open({});
      expect(workbenchEditorService.open).toHaveBeenCalledTimes(1);
    });
  });
});
