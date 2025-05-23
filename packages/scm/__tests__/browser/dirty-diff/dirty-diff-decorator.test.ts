import { Injectable } from '@Nuvio-MCP/di';
import { IContextKeyService } from '@Nuvio-MCP/ide-core-browser/lib/context-key';
import { ILineChange, URI } from '@Nuvio-MCP/ide-core-common';
import { IDocPersistentCacheProvider, OverviewRulerLane } from '@Nuvio-MCP/ide-editor';
import { EmptyDocCacheImpl } from '@Nuvio-MCP/ide-editor/src/browser';
import { IEditorDocumentModel } from '@Nuvio-MCP/ide-editor/src/browser/';
import { EditorDocumentModel } from '@Nuvio-MCP/ide-editor/src/browser/doc-model/main';
import { ITextModel } from '@Nuvio-MCP/ide-monaco/lib/browser/monaco-api/types';

import { createBrowserInjector } from '../../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../../tools/dev-tool/src/mock-injector';
import { MockContextKeyService } from '../../../../monaco/__mocks__/monaco.context-key.service';
import { DirtyDiffDecorator } from '../../../src/browser/dirty-diff/dirty-diff-decorator';
import { DirtyDiffModel } from '../../../src/browser/dirty-diff/dirty-diff-model';
import { SCMPreferences } from '../../../src/browser/scm-preference';

const fakeScmDiffDecorationsGetter = jest.fn();

@Injectable()
class MockSCMPreferencesImpl {
  get ['scm.diffDecorations']() {
    return fakeScmDiffDecorationsGetter();
  }
}

describe('test for scm/src/browser/dirty-diff/dirty-diff-decorator.ts', () => {
  describe('test for DirtyDiffDecorator', () => {
    let injector: MockInjector;
    let editorModel: IEditorDocumentModel;
    let monacoModel: ITextModel;

    beforeEach(() => {
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
            token: SCMPreferences,
            useClass: MockSCMPreferencesImpl,
          },
        ]),
      );

      fakeScmDiffDecorationsGetter.mockReturnValue('all');

      editorModel = injector.get(EditorDocumentModel, [URI.file(`/test/workspace/abcde${Math.random()}.ts`), 'test']);
      monacoModel = editorModel.getMonacoModel();
    });

    it('ok for ChangeType#Add', () => {
      const dirtyDiffModel = injector.get(DirtyDiffModel, [editorModel]);
      const dirtyDiffDecorator = injector.get(DirtyDiffDecorator, [editorModel, dirtyDiffModel]);

      const spy = jest.spyOn(monacoModel, 'deltaDecorations');

      // ChangeType#Add
      const change0: ILineChange = [10, 10, 111, 0, []];
      dirtyDiffModel['_changes'] = [change0];
      dirtyDiffModel['_onDidChange'].fire([
        {
          start: 0,
          deleteCount: 0,
          toInsert: [change0],
        },
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      const decos = spy.mock.calls[0][1];
      expect(decos.length).toBe(1);
      const startLineNumber = change0[2];
      const endLineNumber = change0[3] - 1 || startLineNumber - 1;

      expect(decos[0].range).toEqual({
        startLineNumber,
        startColumn: 1,
        endLineNumber,
        endColumn: 1,
      });
      expect(decos[0].options.linesDecorationsClassName).toBe('dirty-diff-glyph dirty-diff-added');
      expect(decos[0].options.overviewRuler!.position).toBe(OverviewRulerLane.Left);
      expect(decos[0].options.isWholeLine).toBeTruthy();

      expect(dirtyDiffDecorator['decorations'].length).toEqual(1);

      dirtyDiffDecorator.dispose();
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[1][1]).toEqual([]);
      expect(dirtyDiffDecorator['editorModel']).toBeNull();
      expect(dirtyDiffDecorator['decorations']).toEqual([]);

      spy.mockRestore();
    });

    it('ok for ChangeType#Delete', () => {
      // scmPreference['scm.diffDecorations'] === 'overview'
      fakeScmDiffDecorationsGetter.mockReturnValueOnce('overview');

      const dirtyDiffModel = injector.get(DirtyDiffModel, [editorModel]);
      const dirtyDiffDecorator = injector.get(DirtyDiffDecorator, [editorModel, dirtyDiffModel]);

      const spy = jest.spyOn(monacoModel, 'deltaDecorations');

      // ChangeType#Delete
      const change0: ILineChange = [10, 11, 111, 111, []];
      dirtyDiffModel['_changes'] = [change0];
      dirtyDiffModel['_onDidChange'].fire([
        {
          start: 0,
          deleteCount: 0,
          toInsert: [change0],
        },
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      const decos = spy.mock.calls[0][1];
      expect(decos.length).toBe(1);
      const startLineNumber = change0[2];
      expect(decos[0].range).toEqual({
        startLineNumber: startLineNumber - 1,
        startColumn: Number.MAX_VALUE,
        endLineNumber: startLineNumber > 0 ? startLineNumber - 1 : startLineNumber,
        endColumn: Number.MAX_VALUE,
      });
      expect(decos[0].options.linesDecorationsClassName).toBeNull();
      expect(decos[0].options.overviewRuler!.position).toBe(OverviewRulerLane.Left);
      expect(decos[0].options.isWholeLine).toBeFalsy();

      expect(dirtyDiffDecorator['decorations'].length).toEqual(1);

      // set editorModel to null
      dirtyDiffDecorator['editorModel'] = null;
      dirtyDiffDecorator.dispose();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(dirtyDiffDecorator['editorModel']).toBeNull();
      expect(dirtyDiffDecorator['decorations']).toEqual([]);

      spy.mockRestore();
    });

    it('ok for ChangeType#Modify', () => {
      // scmPreference['scm.diffDecorations'] === 'none'
      fakeScmDiffDecorationsGetter.mockReturnValueOnce('none');

      const dirtyDiffModel = injector.get(DirtyDiffModel, [editorModel]);
      const dirtyDiffDecorator = injector.get(DirtyDiffDecorator, [editorModel, dirtyDiffModel]);

      const spy = jest.spyOn(monacoModel, 'deltaDecorations');
      // ChangeType#Modify
      const change0: ILineChange = [1, 10, 111, 1, []];
      dirtyDiffModel['_changes'] = [change0];
      dirtyDiffModel['_onDidChange'].fire([
        {
          start: 0,
          deleteCount: 0,
          toInsert: [change0],
        },
      ]);

      expect(spy).toHaveBeenCalledTimes(1);
      const decos = spy.mock.calls[0][1];
      expect(decos.length).toBe(1);
      const startLineNumber = change0[2];
      const endLineNumber = change0[3] - 1 || startLineNumber - 1;

      expect(decos[0].range).toEqual({
        startLineNumber,
        startColumn: 1,
        endLineNumber,
        endColumn: 1,
      });
      expect(decos[0].options.linesDecorationsClassName).toBeNull();
      expect(decos[0].options.overviewRuler).toBeNull();
      expect(decos[0].options.isWholeLine).toBeTruthy();

      expect(dirtyDiffDecorator['decorations'].length).toEqual(1);

      // isDisposed#true
      monacoModel['_isDisposed'] = true;
      dirtyDiffDecorator.dispose();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(dirtyDiffDecorator['editorModel']).toBeNull();
      expect(dirtyDiffDecorator['decorations']).toEqual([]);

      spy.mockRestore();
    });

    it('this.editorModel is non-existed', () => {
      const dirtyDiffModel = injector.get(DirtyDiffModel, [editorModel]);
      const dirtyDiffDecorator = injector.get(DirtyDiffDecorator, [editorModel, dirtyDiffModel]);

      const spy = jest.spyOn(monacoModel, 'deltaDecorations');
      // ChangeType#Add
      const change0: ILineChange = [1, 10, 111, 0, []];
      dirtyDiffModel['_changes'] = [change0];

      dirtyDiffDecorator['editorModel'] = null;
      dirtyDiffModel['_onDidChange'].fire([
        {
          start: 0,
          deleteCount: 0,
          toInsert: [change0],
        },
      ]);

      expect(spy).toHaveBeenCalledTimes(0);

      dirtyDiffDecorator.dispose();
      expect(spy).toHaveBeenCalledTimes(0);
      expect(dirtyDiffDecorator['editorModel']).toBeNull();
      expect(dirtyDiffDecorator['decorations']).toEqual([]);

      spy.mockRestore();
    });
  });
});
