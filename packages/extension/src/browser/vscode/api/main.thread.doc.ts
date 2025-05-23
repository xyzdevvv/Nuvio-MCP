import { Autowired, INJECTOR_TOKEN, Injectable, Injector, Optional } from '@Nuvio-MCP/di';
import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { PreferenceService } from '@Nuvio-MCP/ide-core-browser';
import { LabelService } from '@Nuvio-MCP/ide-core-browser/lib/services';
import {
  Disposable,
  Emitter,
  Event,
  IDisposable,
  LRUMap,
  OnEvent,
  Schemes,
  URI,
  WithEventBus,
  isUndefinedOrNull,
} from '@Nuvio-MCP/ide-core-common';
import { ResourceService } from '@Nuvio-MCP/ide-editor';
import {
  EditorComponentRegistry,
  EditorDocumentModelContentChangedEvent,
  EditorDocumentModelCreationEvent,
  EditorDocumentModelOptionChangedEvent,
  EditorDocumentModelRemovalEvent,
  EditorDocumentModelSavedEvent,
  EditorDocumentModelWillSaveEvent,
  EditorOpenType,
  IEditorDocumentModelContentProvider,
  IEditorDocumentModelContentRegistry,
  IEditorDocumentModelRef,
  IEditorDocumentModelService,
} from '@Nuvio-MCP/ide-editor/lib/browser';
import { UntitledDocumentIdCounter } from '@Nuvio-MCP/ide-editor/lib/browser/untitled-resource';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service';

import { ExtHostAPIIdentifier, IExtensionHostDocService, IMainThreadDocumentsShape } from '../../../common/vscode';

const DEFAULT_EXT_HOLD_DOC_REF_MAX_AGE = 1000 * 60 * 3; // 插件进程openDocument持有的最长时间
const DEFAULT_EXT_HOLD_DOC_REF_MIN_AGE = 1000 * 20; // 插件进程openDocument持有的最短时间，防止bounce
const DEFAULT_EXT_HOLD_DOC_REF_LENGTH = 1024 * 1024 * 80; // 插件进程openDocument持有的最长长度

@Injectable({ multiple: true })
class ExtensionEditorDocumentProvider implements IEditorDocumentModelContentProvider {
  public onDidChangeContentEmitter = new Emitter<URI>();

  public onDidChangeContent: Event<URI> = this.onDidChangeContentEmitter.event;

  constructor(private proxy: IExtensionHostDocService) {}

  private schemes: Set<string> = new Set();

  public registerScheme(scheme: string): void {
    this.schemes.add(scheme);
  }

  public unregisterScheme(scheme: string): void {
    this.schemes.delete(scheme);
  }

  handlesScheme(scheme: string) {
    return this.schemes.has(scheme);
  }

  provideEditorDocumentModelContent(uri: URI, encoding?: string): Promise<string> {
    return this.proxy.$provideTextDocumentContent(uri.toString(), encoding);
  }

  isReadonly(uri: URI): boolean {
    return true;
  }
}

@Injectable({ multiple: true })
export class MainThreadExtensionDocumentData extends WithEventBus implements IMainThreadDocumentsShape {
  private readonly proxy: IExtensionHostDocService;

  @Autowired()
  private tempDocIdCount: UntitledDocumentIdCounter;

  @Autowired(IEditorDocumentModelService)
  protected docManager: IEditorDocumentModelService;

  @Autowired(IEditorDocumentModelContentRegistry)
  private contentRegistry: IEditorDocumentModelContentRegistry;

  @Autowired()
  private resourceService: ResourceService;

  @Autowired()
  private editorComponentRegistry: EditorComponentRegistry;

  @Autowired()
  labelService: LabelService;

  @Autowired(INJECTOR_TOKEN)
  injector: Injector;

  @Autowired(PreferenceService)
  preference: PreferenceService;

  @Autowired(IFileServiceClient)
  fileServiceClient: IFileServiceClient;

  provider: ExtensionEditorDocumentProvider;

  private editorDisposers: Map<string, IDisposable> = new Map();

  private extHoldDocuments = new LimitedMainThreadDocumentCollection();

  private docSyncEnabled = new LRUMap<string, boolean>(200, 100);

  public isDocSyncEnabled(uri: URI | string): boolean {
    const uriString = uri.toString();
    if (!this.docSyncEnabled.has(uriString)) {
      const docRef = this.docManager.getModelReference(new URI(uriString), 'mainthread doc size');
      if (docRef) {
        this.docSyncEnabled.set(
          uriString,
          docRef.instance.getMonacoModel().getValueLength() <
            this.preference.getValid<number>('editor.docExtHostSyncMaxSize', 4 * 1024 * 1024 * 1024),
        );
        docRef.dispose();
      }
    }
    return this.docSyncEnabled.get(uriString) ?? false;
  }

  public isDocIgnored(uri: URI): boolean {
    return uri.codeUri.scheme === Schemes.walkThroughSnippet;
  }

  constructor(@Optional(Symbol()) private rpcProtocol: IRPCProtocol) {
    super();

    this.proxy = this.rpcProtocol.getProxy(ExtHostAPIIdentifier.ExtHostDocuments);
    this.provider = this.injector.get(ExtensionEditorDocumentProvider, [this.proxy]);
    this.contentRegistry.registerEditorDocumentModelContentProvider(this.provider);
    // sync
    this.docManager.getAllModels().map((doc) => {
      if (!this.isDocSyncEnabled(doc.uri)) {
        return;
      }
      this.proxy.$fireModelOpenedEvent({
        uri: doc.uri.toString(),
        lines: doc.getText().split(doc.eol),
        eol: doc.eol,
        dirty: doc.dirty,
        languageId: doc.languageId,
        versionId: doc.getMonacoModel().getVersionId(),
      });
    });
  }

  @OnEvent(EditorDocumentModelContentChangedEvent)
  onEditorDocumentModelContentChangeEvent(e: EditorDocumentModelContentChangedEvent) {
    if (!this.isDocSyncEnabled(e.payload.uri) || this.isDocIgnored(e.payload.uri)) {
      return;
    }

    this.proxy.$fireModelChangedEvent({
      changes: e.payload.changes,
      uri: e.payload.uri.toString(),
      eol: e.payload.eol,
      dirty: e.payload.dirty,
      versionId: e.payload.versionId,
      isRedoing: e.payload.isRedoing,
      isUndoing: e.payload.isUndoing,
    });
  }

  @OnEvent(EditorDocumentModelWillSaveEvent)
  async onEditorDocumentModelWillSaveEvent(e: EditorDocumentModelWillSaveEvent) {
    if (!this.isDocSyncEnabled(e.payload.uri) || this.isDocIgnored(e.payload.uri)) {
      return;
    }
    await this.proxy.$fireModelWillSaveEvent({
      uri: e.payload.uri.toString(),
      reason: e.payload.reason,
      dirty: e.payload.dirty,
    });
  }

  @OnEvent(EditorDocumentModelOptionChangedEvent)
  onEditorDocumentModelOptionChangedEvent(e: EditorDocumentModelOptionChangedEvent) {
    if (!this.isDocSyncEnabled(e.payload.uri) || this.isDocIgnored(e.payload.uri)) {
      return;
    }
    this.proxy.$fireModelOptionsChangedEvent({
      encoding: e.payload.encoding,
      uri: e.payload.uri.toString(),
      languageId: e.payload.languageId,
      dirty: e.payload.dirty,
    });
  }

  @OnEvent(EditorDocumentModelCreationEvent)
  onEditorDocumentModelContentCreationEvent(e: EditorDocumentModelCreationEvent) {
    if (!this.isDocSyncEnabled(e.payload.uri) || this.isDocIgnored(e.payload.uri)) {
      return;
    }
    this.proxy.$fireModelOpenedEvent({
      uri: e.payload.uri.toString(),
      lines: e.payload.content.split(e.payload.eol),
      eol: e.payload.eol,
      dirty: false,
      languageId: e.payload.languageId,
      versionId: e.payload.versionId,
    });
  }

  @OnEvent(EditorDocumentModelRemovalEvent)
  onEditorDocumentModelRemovedEvent(e: EditorDocumentModelRemovalEvent) {
    if (!this.isDocSyncEnabled(e.payload) || this.isDocIgnored(e.payload)) {
      return;
    }
    this.proxy.$fireModelRemovedEvent({
      uri: e.payload.toString(),
    });
  }

  @OnEvent(EditorDocumentModelSavedEvent)
  onEditorDocumentModelSavingEvent(e: EditorDocumentModelSavedEvent) {
    if (!this.isDocSyncEnabled(e.payload) || this.isDocIgnored(e.payload)) {
      return;
    }
    this.proxy.$fireModelSavedEvent({
      uri: e.payload.toString(),
    });
  }

  async $tryCreateDocument(options?: { content?: string; language?: string }): Promise<string> {
    if (!options) {
      options = {};
    }
    const { language, content } = options;
    const docRef = await this.docManager.createModelReference(
      new URI(`${Schemes.untitled}://temp/Untitled-` + this.tempDocIdCount.id),
      'ext-create-document',
    );
    if (language) {
      docRef.instance.languageId = language;
    }
    if (!isUndefinedOrNull(content)) {
      docRef.instance.updateContent(content);
    }
    return docRef.instance.uri.toString();
  }

  async $tryOpenDocument(uri: string) {
    const docRef = await this.docManager.createModelReference(new URI(uri), 'ext-open-document');
    this.extHoldDocuments.add(docRef);
  }

  async $trySaveDocument(uri: string) {
    const docRef = await this.docManager.getModelReference(new URI(uri), 'ext-saving-document');
    if (docRef) {
      try {
        return docRef.instance.save(true);
      } finally {
        docRef.dispose();
      }
    }
    return false;
  }

  async $fireTextDocumentChangedEvent(uri: string) {
    this.provider.onDidChangeContentEmitter.fire(new URI(uri));
  }

  $unregisterDocumentProviderWithScheme(scheme: string) {
    if (this.editorDisposers.has(scheme)) {
      this.editorDisposers.get(scheme)!.dispose();
      this.editorDisposers.delete(scheme);
    }
  }

  $registerDocumentProviderWithScheme(scheme: string) {
    this.$unregisterDocumentProviderWithScheme(scheme);
    const disposer = new Disposable();
    disposer.addDispose(
      this.resourceService.registerResourceProvider({
        scheme,
        provideResource: async (uri) =>
          Promise.all([this.labelService.getName(uri), this.labelService.getIcon(uri)]).then(([name, icon]) => ({
            name,
            icon,
            uri,
            metadata: null,
          })),
      }),
    );
    disposer.addDispose(
      this.editorComponentRegistry.registerEditorComponentResolver(scheme, (resource, results) => {
        if (this.fileServiceClient.handlesScheme(scheme)) {
          // 有插件会同时注册 documentProvider 和 fileSystem，如果这里注册了 fileSystem，就不再添加打开类型
          return;
        }
        results.push({
          type: EditorOpenType.code,
          readonly: true,
        });
      }),
    );
    disposer.addDispose({
      dispose: () => {
        this.provider.unregisterScheme(scheme);
      },
    });
    this.provider.registerScheme(scheme);
    this.editorDisposers.set(scheme, disposer);
  }

  dispose() {
    super.dispose();

    for (const disposable of this.editorDisposers.values()) {
      disposable.dispose();
    }
    this.editorDisposers.clear();
  }
}

class LimitedMainThreadDocumentCollection {
  private maxLength = DEFAULT_EXT_HOLD_DOC_REF_LENGTH;
  private maxAge = DEFAULT_EXT_HOLD_DOC_REF_MAX_AGE;
  private minAge = DEFAULT_EXT_HOLD_DOC_REF_MIN_AGE;

  private refs: {
    ref: IEditorDocumentModelRef;
    dispose(): void;
    createTimeStamp: number;
  }[] = [];

  private length = 0;

  public add(docRef: IEditorDocumentModelRef) {
    const length = docRef.instance.getText().length; // 只使用openDocument时的length，这个length之后可能会改变，但不管
    this.length += length;
    let maxTimeout: any = null;
    const ref = {
      ref: docRef,
      dispose: () => {
        const index = this.refs.indexOf(ref);
        if (index !== 0) {
          this.length -= length;
          docRef.dispose();
          clearTimeout(maxTimeout!);
          this.refs.splice(index, 1);
        }
      },
      createTimeStamp: new Date().getTime(),
    };

    maxTimeout = setTimeout(() => {
      ref.dispose();
    }, this.maxAge);

    this.refs.push(ref);
    this.clean();
  }

  private clean() {
    // 这里如果只有一个ref，就不dispose了，不然容易出现反复打开关闭
    while (this.length > this.maxLength && this.refs.length > 1) {
      const toDispose = this.refs[0];
      if (toDispose.createTimeStamp + this.minAge > new Date().getTime()) {
        break; // 持有时间太短
      }
      this.disposeFirst();
    }
  }

  private disposeFirst() {
    const toDispose = this.refs.shift();
    if (toDispose) {
      toDispose.dispose();
    }
  }
}
