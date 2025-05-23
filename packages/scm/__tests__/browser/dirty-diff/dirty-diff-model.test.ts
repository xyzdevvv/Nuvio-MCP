import { Autowired, INJECTOR_TOKEN, Injectable, Injector } from '@Nuvio-MCP/di';
import { IContextKeyService } from '@Nuvio-MCP/ide-core-browser/lib/context-key';
import { CommandService, Event, ILineChange, URI, toDisposable } from '@Nuvio-MCP/ide-core-common';
import { EditorCollectionService, IDocPersistentCacheProvider } from '@Nuvio-MCP/ide-editor';
import { EmptyDocCacheImpl, IEditorDocumentModel, IEditorDocumentModelService } from '@Nuvio-MCP/ide-editor/src/browser';
import { EditorDocumentModel } from '@Nuvio-MCP/ide-editor/src/browser/doc-model/main';
import * as monaco from '@Nuvio-MCP/ide-monaco';
import { DetailedLineRangeMapping, positionToRange } from '@Nuvio-MCP/ide-monaco';
import { LineRange } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/core/lineRange';
import {
  IDiffComputationResult,
  IEditorWorkerService,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/services/editorWorker';
import { StandaloneServices } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneServices';

import { createBrowserInjector } from '../../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../../tools/dev-tool/src/mock-injector';
import { createMockedMonaco } from '../../../../monaco/__mocks__/monaco';
import { MockContextKeyService } from '../../../../monaco/__mocks__/monaco.context-key.service';
import { ISCMRepository, SCMService } from '../../../src';
import { DirtyDiffModel } from '../../../src/browser/dirty-diff/dirty-diff-model';
import { DirtyDiffWidget } from '../../../src/browser/dirty-diff/dirty-diff-widget';
import { MockSCMProvider } from '../../scm-test-util';

import type { ICodeEditor as IMonacoCodeEditor } from '@Nuvio-MCP/ide-monaco/lib/browser/monaco-api/types';

@Injectable()
class MockEditorDocumentModelService {
  @Autowired(INJECTOR_TOKEN)
  private readonly injector: Injector;

  private readonly instances: Map<string, EditorDocumentModel> = new Map();

  async createModelReference(uri: URI) {
    if (!this.instances.has(uri.toString())) {
      const instance = this.injector.get(EditorDocumentModel, [uri, 'test-content']);
      this.instances.set(uri.toString(), instance);
    }
    return { instance: this.instances.get(uri.toString()) };
  }
}

const mockedMonaco = createMockedMonaco();
(global as any).monaco = mockedMonaco;

jest.useFakeTimers();

// mock ThrottledDelayer to take it easy in unit test
jest.mock('@Nuvio-MCP/ide-core-common', () => ({
  ...jest.requireActual('@Nuvio-MCP/ide-core-common'),
  ThrottledDelayer: class {
    constructor() {}
    trigger(promiseFactory: () => Promise<any>) {
      return promiseFactory();
    }
    isTriggered() {
      return false;
    }
    cancel() {}
  },
}));

describe('scm/src/browser/dirty-diff/dirty-diff-model.ts', () => {
  describe('test for DirtyDiffDecorator', () => {
    let injector: MockInjector;
    let scmService: SCMService;
    let repo: ISCMRepository;
    let commandService: CommandService;
    let provider: MockSCMProvider;
    let codeEditor: IMonacoCodeEditor;

    async function createModel(filePath: string) {
      const modelManager = injector.get(IEditorDocumentModelService);
      const fileTextModel = await modelManager.createModelReference(URI.file(filePath));
      const gitTextModel = await modelManager.createModelReference(
        URI.from({
          scheme: 'git',
          path: filePath,
          query: 'ref=""',
        }),
      );

      return {
        fileTextModel: fileTextModel.instance,
        gitTextModel: gitTextModel.instance,
      } as {
        fileTextModel: IEditorDocumentModel;
        gitTextModel: IEditorDocumentModel;
      };
    }

    let computeDiffRet: IDiffComputationResult | null = null;
    const mockComputeDiff = jest.fn();

    beforeEach(() => {
      StandaloneServices.get(IEditorWorkerService).canComputeDirtyDiff = () => true;
      StandaloneServices.get(IEditorWorkerService).computeDiff = async () => ({
        ...computeDiffRet!,
        changes: computeDiffRet!.changes.map(
          (e) => new DetailedLineRangeMapping(new LineRange(e[0], e[1]), new LineRange(e[2], e[3]), []),
        ),
        moves: [],
      });

      injector = createBrowserInjector(
        [],
        new MockInjector([
          {
            token: IContextKeyService,
            useClass: MockContextKeyService,
          },
          {
            token: IDocPersistentCacheProvider,
            useClass: EmptyDocCacheImpl,
          },
          {
            token: IEditorDocumentModelService,
            useClass: MockEditorDocumentModelService,
          },
          {
            token: CommandService,
            useValue: {
              executeCommand: jest.fn(),
            },
          },
          {
            token: EditorCollectionService,
            useValue: {},
          },
          SCMService,
        ]),
      );

      scmService = injector.get(SCMService);
      provider = new MockSCMProvider(1);
      repo = scmService.registerSCMProvider(provider);
      commandService = injector.get(CommandService);
      codeEditor = mockedMonaco.editor!.create(document.createElement('div'));
    });

    afterEach(() => {
      codeEditor.setModel(null);
      codeEditor?.dispose();
      mockComputeDiff.mockRestore();
    });

    it('ok: check basic property', async () => {
      const { fileTextModel } = await createModel('/test/workspace/abc1.ts');
      codeEditor.setModel(fileTextModel.getMonacoModel());
      const dirtyDiffModel = injector.get(DirtyDiffModel, [fileTextModel]);
      expect(dirtyDiffModel.modified).toEqual(fileTextModel);
      expect(dirtyDiffModel.original).toBeUndefined();
      expect(dirtyDiffModel.changes).toEqual([]);

      // private property
      const editorWorkerServiceMethods = Object.keys(dirtyDiffModel['editorWorkerService']);
      expect(editorWorkerServiceMethods).toContain('canComputeDirtyDiff');
      expect(editorWorkerServiceMethods).toContain('computeDiff');
      fileTextModel.dispose();
    });

    it('ok for one repo', async () => {
      const { fileTextModel, gitTextModel } = await createModel('/test/workspace/abc2.ts');
      codeEditor.setModel(fileTextModel.getMonacoModel());
      const dirtyDiffModel = injector.get(DirtyDiffModel, [fileTextModel]);
      expect(dirtyDiffModel.modified).toEqual(fileTextModel);

      dirtyDiffModel['_originalModel'] = gitTextModel;
      expect(dirtyDiffModel.original).toEqual(gitTextModel);

      // mock computeDiff compute a diff changes
      const change0: ILineChange = [2, 5, 6, 8, []];
      computeDiffRet = {
        quitEarly: false,
        identical: false,
        changes: [change0],
        moves: [],
      };
      fileTextModel.getMonacoModel().setValue('insert some content for testing');

      return Event.toPromise(dirtyDiffModel.onDidChange).then((changes) => {
        expect(changes).toEqual([
          {
            start: 0,
            deleteCount: 0,
            toInsert: [change0],
          },
        ]);
        expect(dirtyDiffModel.original?.uri.scheme).toBe('git');
      });
    });

    it('ok when repo#onDidChange', async () => {
      const { fileTextModel, gitTextModel } = await createModel('/test/workspace/abc3.ts');

      const dirtyDiffModel = injector.get(DirtyDiffModel, [fileTextModel]);
      dirtyDiffModel['_originalModel'] = gitTextModel;

      // mock computeDiff compute a diff changes
      const change0: ILineChange = [2, 5, 6, 8, []];

      computeDiffRet = {
        quitEarly: false,
        identical: false,
        changes: [change0],
        moves: [],
      };
      provider.onDidChangeEmitter.fire();

      return Event.toPromise(dirtyDiffModel.onDidChange).then((changes) => {
        expect(changes).toEqual([
          {
            start: 0,
            deleteCount: 0,
            toInsert: [change0],
          },
        ]);
        expect(dirtyDiffModel.original?.uri.scheme).toBe('git');
      });
    });

    it('ok when repo#onDidChangeResources', async () => {
      const { fileTextModel, gitTextModel } = await createModel('/test/workspace/abc4.ts');

      const dirtyDiffModel = injector.get(DirtyDiffModel, [fileTextModel]);
      dirtyDiffModel['_originalModel'] = gitTextModel;

      // mock computeDiff compute a diff changes
      const change0: ILineChange = [2, 5, 6, 8, []];

      computeDiffRet = {
        quitEarly: false,
        identical: false,
        changes: [change0],
        moves: [],
      };
      provider.onDidChangeResourcesEmitter.fire();

      return Event.toPromise(dirtyDiffModel.onDidChange).then((changes) => {
        expect(changes).toEqual([
          {
            start: 0,
            deleteCount: 0,
            toInsert: [change0],
          },
        ]);
        expect(dirtyDiffModel.original?.uri.scheme).toBe('git');
      });
    });

    it('ok for no repo', async () => {
      const { fileTextModel, gitTextModel } = await createModel('/test/workspace/abc5.ts');

      repo.dispose();
      const dirtyDiffModel = injector.get(DirtyDiffModel, [fileTextModel]);
      dirtyDiffModel['_originalModel'] = gitTextModel;

      // no repo matched so won't trigger any onDidChange event
      const eventSpy = jest.spyOn(dirtyDiffModel['_onDidChange'], 'fire');
      const triggerDiffSpy = jest.spyOn<DirtyDiffModel, any>(dirtyDiffModel, 'triggerDiff');

      expect(dirtyDiffModel.modified).toEqual(fileTextModel);
      fileTextModel.getMonacoModel().setValue('insert some content for testing');

      expect(eventSpy).toHaveBeenCalledTimes(0);
      // editor content changed trigger a `triggerDiff`
      expect(triggerDiffSpy).toHaveBeenCalledTimes(1);
      eventSpy.mockReset();
      triggerDiffSpy.mockReset();
    });

    it('find changes', async () => {
      const { fileTextModel, gitTextModel } = await createModel('/test/workspace/abc6.ts');

      const dirtyDiffModel = injector.get(DirtyDiffModel, [fileTextModel]);
      dirtyDiffModel['_originalModel'] = gitTextModel;
      const change0: ILineChange = [11, 11, 11, 11, []];
      const change1: ILineChange = [12, 12, 12, 12, []];
      const change2: ILineChange = [14, 14, 14, 14, []];
      const change3: ILineChange = [15, 15, 15, 15, []];

      dirtyDiffModel['_changes'] = [change0, change1, change2, change3];

      // findNextClosestChangeLineNumber\findPreviousClosestChangeLineNumber
      expect(dirtyDiffModel.findNextClosestChangeLineNumber(11)).toBe(11);
      expect(dirtyDiffModel.findNextClosestChangeLineNumber(11, false)).toBe(12);
      expect(dirtyDiffModel.findNextClosestChangeLineNumber(12, false)).toBe(14);

      expect(dirtyDiffModel.findNextClosestChangeLineNumber(10, false)).toBe(11);
      expect(dirtyDiffModel.findNextClosestChangeLineNumber(16, false)).toBe(11);

      expect(dirtyDiffModel.findPreviousClosestChangeLineNumber(15)).toBe(15);
      expect(dirtyDiffModel.findPreviousClosestChangeLineNumber(15, false)).toBe(14);
      expect(dirtyDiffModel.findPreviousClosestChangeLineNumber(14, false)).toBe(12);

      expect(dirtyDiffModel.findPreviousClosestChangeLineNumber(10, false)).toBe(15);
      expect(dirtyDiffModel.findPreviousClosestChangeLineNumber(16, false)).toBe(15);

      // getChangeFromRange
      expect(dirtyDiffModel.getChangeFromRange(positionToRange(10))).toEqual({
        change: change0,
        count: 1,
      });
      expect(dirtyDiffModel.getChangeFromRange(positionToRange(11))).toEqual({
        change: change0,
        count: 1,
      });
      expect(dirtyDiffModel.getChangeFromRange(positionToRange(12))).toEqual({
        change: change1,
        count: 2,
      });
      expect(dirtyDiffModel.getChangeFromRange(positionToRange(15))).toEqual({
        change: change3,
        count: 4,
      });
      expect(dirtyDiffModel.getChangeFromRange(positionToRange(16))).toEqual({
        change: change0,
        count: 1,
      });
    });

    it('dispose', async () => {
      const { fileTextModel, gitTextModel } = await createModel('/test/workspace/abc7.ts');

      const dirtyDiffModel = injector.get(DirtyDiffModel, [fileTextModel]);
      dirtyDiffModel['_originalModel'] = gitTextModel;

      dirtyDiffModel['_originalModel'] = injector.get(EditorDocumentModel, [
        URI.from({
          scheme: 'git',
          path: 'test/workspace/abc71.ts',
          query: 'ref=""',
        }),
        'test',
      ]);
      const delayerSpy = jest.spyOn(dirtyDiffModel['diffDelayer']!, 'cancel');

      dirtyDiffModel['repositoryDisposables'].add(toDisposable(jest.fn()));
      dirtyDiffModel['repositoryDisposables'].add(toDisposable(jest.fn()));
      expect(dirtyDiffModel['repositoryDisposables'].size).toBeGreaterThan(0);

      dirtyDiffModel.dispose();

      expect(dirtyDiffModel.original).toBeNull();
      expect(dirtyDiffModel.modified).toBeNull();
      expect(delayerSpy).toHaveBeenCalledTimes(1);
      expect(dirtyDiffModel['diffDelayer']).toBeNull();
      expect(dirtyDiffModel['repositoryDisposables'].size).toBe(0);

      delayerSpy.mockReset();
    });

    describe('onClickDecoration', () => {
      let mockCompare: jest.Mock;
      let originalMonacoEditor: monaco.editor.ICodeEditor;
      let modifiedMonacoEditor: monaco.editor.ICodeEditor;

      function createDirtyDiffModel(fileTextModel, gitTextModel) {
        const dirtyDiffModel = injector.get(DirtyDiffModel, [fileTextModel]);
        dirtyDiffModel['_originalModel'] = gitTextModel;
        return dirtyDiffModel;
      }

      async function createDirtyDiffWidget(filePath: string) {
        const { fileTextModel, gitTextModel } = await createModel(filePath);
        const dirtyDiffModel = createDirtyDiffModel(fileTextModel, gitTextModel);
        const dirtyDiffWidget = injector.get(DirtyDiffWidget, [codeEditor, dirtyDiffModel, commandService]);
        return {
          dirtyDiffModel,
          dirtyDiffWidget,
        };
      }

      beforeEach(() => {
        const diffEditor = mockedMonaco.editor!.createDiffEditor(document.createElement('div'));
        originalMonacoEditor = diffEditor.getOriginalEditor();
        modifiedMonacoEditor = diffEditor.getModifiedEditor();

        mockCompare = jest.fn();
        injector.overrideProviders({
          token: EditorCollectionService,
          useValue: {
            createDiffEditor: () => ({
              compare: mockCompare,
              originalEditor: { monacoEditor: originalMonacoEditor },
              modifiedEditor: { monacoEditor: modifiedMonacoEditor },
            }),
          },
        });

        DirtyDiffModel.prototype['triggerDiff'] = jest.fn(); // avoid `changes` changed
      });

      it('basic check', async () => {
        const { dirtyDiffModel, dirtyDiffWidget } = await createDirtyDiffWidget('/test/workspace/abc9.ts');
        const range = positionToRange(10);
        const spy = jest.spyOn(dirtyDiffWidget, 'dispose');
        dirtyDiffModel['_widget'] = null;
        expect(spy).toHaveBeenCalledTimes(0);

        dirtyDiffModel.onClickDecoration(dirtyDiffWidget, range);
        expect(dirtyDiffModel['_widget']).toEqual(dirtyDiffWidget);
        expect(spy).toHaveBeenCalledTimes(0);

        const newDirtyDiffWidget = injector.get(DirtyDiffWidget, [codeEditor, dirtyDiffModel, commandService]);

        dirtyDiffModel.onClickDecoration(newDirtyDiffWidget, range);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(dirtyDiffModel['_widget']).toEqual(newDirtyDiffWidget);

        spy.mockReset();
        dirtyDiffModel.dispose();
      });

      it('dirty editor in zone widget', async () => {
        const { dirtyDiffModel, dirtyDiffWidget } = await createDirtyDiffWidget('/test/workspace/abc11.ts');
        codeEditor.setModel(dirtyDiffModel.modified?.getMonacoModel() ?? null);
        const change0: ILineChange = [11, 11, 11, 11, []];
        const change1: ILineChange = [12, 12, 12, 12, []];
        const change2: ILineChange = [14, 14, 14, 14, []];
        const change3: ILineChange = [15, 15, 15, 15, []];

        dirtyDiffModel['_changes'].push(change1, change2, change3);

        const editorService = injector.get(EditorCollectionService);
        const spyList: jest.SpyInstance[] = [];
        const createDiffEditorSpy = jest.spyOn(editorService, 'createDiffEditor');
        const updateOptionsSpy1 = jest.spyOn(originalMonacoEditor, 'updateOptions');
        const updateOptionsSpy2 = jest.spyOn(modifiedMonacoEditor, 'updateOptions');
        const revealLineInCenterSpy = jest.spyOn(modifiedMonacoEditor, 'revealLineInCenter');
        const relayoutSpy = jest.spyOn(dirtyDiffWidget, 'relayout');
        spyList.push(createDiffEditorSpy, updateOptionsSpy1, updateOptionsSpy2, revealLineInCenterSpy, relayoutSpy);

        const range = positionToRange(12);
        await dirtyDiffModel.onClickDecoration(dirtyDiffWidget, range);

        // createDiffEditor
        expect(createDiffEditorSpy).toHaveBeenCalledTimes(1);
        expect((createDiffEditorSpy.mock.calls[0][0] as HTMLDivElement).tagName).toBe('DIV');
        expect(createDiffEditorSpy.mock.calls[0][1]).toEqual({
          automaticLayout: true,
          renderSideBySide: false,
          hideUnchangedRegions: { enabled: false },
        });

        // editor.compare
        expect(mockCompare).toHaveBeenCalledTimes(1);
        expect(mockCompare.mock.calls[0][0].instance.uri.scheme).toBe('git');
        expect(mockCompare.mock.calls[0][1].instance.uri.scheme).toBe('file');

        // monacoEditor.updateOption
        expect(updateOptionsSpy1).toHaveBeenCalledTimes(1);
        expect(updateOptionsSpy2).toHaveBeenCalledTimes(1);
        expect(updateOptionsSpy1.mock.calls[0][0]).toEqual({ readOnly: true });
        expect(updateOptionsSpy2.mock.calls[0][0]).toEqual({ readOnly: true });

        // monacoEditor.revealLineInCenter
        expect(revealLineInCenterSpy).toHaveBeenCalledTimes(1);
        expect(revealLineInCenterSpy).toHaveBeenCalledWith(7);

        expect(dirtyDiffWidget.currentIndex).toBe(1);
        expect(dirtyDiffWidget.currentRange).toEqual(positionToRange(11));
        expect(dirtyDiffWidget.currentHeightInLines).toBe(10);

        // this.onDidChange
        dirtyDiffModel['_changes'].unshift(change0);
        dirtyDiffModel['_onDidChange'].fire([
          {
            start: 0,
            deleteCount: 0,
            toInsert: [change0],
          },
        ]);

        expect(dirtyDiffWidget.currentIndex).toBe(2);
        expect(dirtyDiffWidget.currentRange).toEqual(positionToRange(11));
        expect(dirtyDiffWidget.currentHeightInLines).toBe(10);

        // originalEditor.monacoEditor.onDidChangeModelContent
        originalMonacoEditor['_onDidChangeModelContent'].fire();
        expect(relayoutSpy).toHaveBeenCalledTimes(1);
        expect(relayoutSpy).toHaveBeenCalledWith(10);

        // widget.onDispose
        dirtyDiffWidget.dispose();
        expect(dirtyDiffModel['_widget']).toBeNull();

        spyList.forEach((spy) => spy.mockReset());
      });
    });
  });
});
