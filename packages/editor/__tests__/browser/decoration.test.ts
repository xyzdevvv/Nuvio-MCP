import { Disposable, Emitter, IEventBus, URI } from '@Nuvio-MCP/ide-core-browser';
import {
  EditorDecorationChangeEvent,
  EditorDecorationTypeRemovedEvent,
  IEditorDecorationCollectionService,
} from '@Nuvio-MCP/ide-editor/lib/browser';
import { EditorDecorationCollectionService } from '@Nuvio-MCP/ide-editor/lib/browser/editor.decoration.service';
import { createMockedMonaco } from '@Nuvio-MCP/ide-monaco/__mocks__/monaco';
import { IThemeService } from '@Nuvio-MCP/ide-theme';
import { ICSSStyleService } from '@Nuvio-MCP/ide-theme/lib/common/style';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MonacoEditorDecorationApplier } from '../../src/browser/decoration-applier';

describe('editor decoration service test', () => {
  const injector = createBrowserInjector([]);

  injector.addProviders({
    token: IEditorDecorationCollectionService,
    useClass: EditorDecorationCollectionService,
  });

  const decorationService: IEditorDecorationCollectionService = injector.get(IEditorDecorationCollectionService);
  const decorationServiceImpl = decorationService as EditorDecorationCollectionService;

  const _decorationChange = new Emitter<URI>();
  let className = 'testDecoration';
  const provider = {
    schemes: ['file'],
    key: 'test',
    provideEditorDecoration: (uri) => {
      if (uri.toString().endsWith('.js')) {
        return [
          {
            range: {
              startLineNumber: 1,
              endColumn: 1,
              startColumn: 1,
              endLineNumber: 1,
            },
            options: {
              description: 'test',
              className,
              isWholeLine: true,
            },
          },
        ];
      }
    },
    onDidDecorationChange: _decorationChange.event,
  };

  const mockedMonaco = createMockedMonaco();

  it('should be able to register decoration providers', () => {
    const disposer = decorationService.registerDecorationProvider(provider);

    expect(decorationServiceImpl.decorationProviders.get(provider.key)).toEqual(provider);

    disposer.dispose();

    expect(decorationServiceImpl.decorationProviders.get(provider.key)).toBeUndefined();
  });

  it('should be able to correctly resolve decoration', async () => {
    const disposer = decorationService.registerDecorationProvider(provider);
    const result = await decorationService.getDecorationFromProvider(new URI('file://test/test.js'));
    expect(result[provider.key]).not.toBeUndefined();
    expect(result[provider.key][0]).not.toBeUndefined();

    expect(result[provider.key][0].options.className).toEqual(className);

    const anotherResult = await decorationService.getDecorationFromProvider(new URI('file://test/test.ts'));
    expect(anotherResult[provider.key]).toBeUndefined();
    disposer.dispose();
  });

  it('should be able to listen to event', async () => {
    const disposer = decorationService.registerDecorationProvider(provider);
    const uri = new URI('file://test/test.js');
    (injector.get(IEventBus) as IEventBus).on(EditorDecorationChangeEvent, async (e) => {
      if (e.payload.uri.isEqual(uri)) {
        const result = await decorationService.getDecorationFromProvider(uri, e.payload.key);
        expect(result[provider.key]).not.toBeUndefined();
        expect(result[provider.key][0]).not.toBeUndefined();

        expect(result[provider.key][0].options.className).toEqual(className);
      }
    });
    className = 'testDecoration2';
    _decorationChange.fire(uri);

    disposer.dispose();
  });

  it('decoration applier test', async () => {
    injector.mockService(IThemeService, {
      getCurrentThemeSync: jest.fn(() => ({
        type: 'dark',
      })),
    });
    injector.mockService(ICSSStyleService, {
      addClass: jest.fn(() => new Disposable()),
    });

    const disposer = decorationService.createTextEditorDecorationType(
      {
        backgroundColor: 'black',
        after: {
          backgroundColor: 'red',
        },
        before: {
          backgroundColor: 'green',
        },
      },
      'test2',
    );
    const disposer2 = decorationService.registerDecorationProvider(provider);

    const editor = mockedMonaco.editor!.create(document.createElement('div'));

    editor.setModel(mockedMonaco.editor!.createModel('', undefined, mockedMonaco.Uri!.parse('file:///test/test.js')));

    const applier = injector.get(MonacoEditorDecorationApplier, [editor]);

    applier.applyDecoration('test2', [
      {
        range: {
          startLineNumber: 1,
          endColumn: 1,
          startColumn: 1,
          endLineNumber: 1,
        },
        hoverMessage: 'testHoverMessage',
      },
    ]);

    expect(editor.deltaDecorations).toHaveBeenCalled();
    (editor.deltaDecorations as any).mockClear();

    const eventBus: IEventBus = injector.get(IEventBus);

    await eventBus.fireAndAwait(new EditorDecorationTypeRemovedEvent('test2'));

    expect(editor.deltaDecorations).toHaveBeenCalled();
    (editor.deltaDecorations as any).mockClear();

    (editor as any)._onDidChangeModel.fire();

    expect(editor.deltaDecorations).toHaveBeenCalled();
    (editor.deltaDecorations as any).mockClear();

    await eventBus.fireAndAwait(
      new EditorDecorationChangeEvent({
        uri: new URI('file:///test/test.js'),
        key: 'test',
      }),
    );

    expect(editor.deltaDecorations).toHaveBeenCalled();
    (editor.deltaDecorations as any).mockClear();

    disposer.dispose();
    disposer2.dispose();
  });

  afterAll(async () => {
    await injector.disposeAll();
  });
});
