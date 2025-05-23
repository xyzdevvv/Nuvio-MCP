import { Emitter } from '@Nuvio-MCP/ide-core-common';
import { CursorStatus, ILanguageService, WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { EditorStatusBarService } from '@Nuvio-MCP/ide-editor/lib/browser/editor.status-bar.service';
import { IStatusBarService } from '@Nuvio-MCP/ide-status-bar/lib/common';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';

describe('editor status bar item test', () => {
  const injector = createBrowserInjector([]);
  const _activeResourceChangeEvent: Emitter<void> = new Emitter<void>();
  const _cursorChangeEmitter: Emitter<CursorStatus> = new Emitter<CursorStatus>();

  beforeAll(() => {
    injector.mockService(WorkbenchEditorService, {
      currentEditor: {
        currentDocumentModel: {
          languageId: 'javascript',
          encoding: 'utf8',
          eol: 'lf',
          getMonacoModel: () => ({
            getOptions: () => ({
              insertSpaces: 2,
              tabSize: 2,
            }),
          }),
        },
      },
      onActiveResourceChange: _activeResourceChangeEvent.event,
      onCursorChange: _cursorChangeEmitter.event,
    });
    injector.mockService(IStatusBarService);
    injector.mockService(ILanguageService);
  });

  it('status bar service should work', () => {
    const service = injector.get<EditorStatusBarService>(EditorStatusBarService);
    const statusBarService: IStatusBarService = injector.get(IStatusBarService);
    const editorService = injector.get(WorkbenchEditorService);

    service.setListener();

    _activeResourceChangeEvent.fire();
    expect(statusBarService.addElement).toHaveBeenCalledTimes(4);

    _cursorChangeEmitter.fire({
      selectionLength: 10,
      position: {
        lineNumber: 1,
        column: 1,
      },
    });

    expect(statusBarService.addElement).toHaveBeenCalledTimes(5);

    editorService.currentEditor = undefined;

    _activeResourceChangeEvent.fire();
    expect(statusBarService.removeElement).toHaveBeenCalledTimes(4);
  });
});
