import { Injectable } from '@Nuvio-MCP/di';
import { MaybePromise, Schemes, URI, Emitter, Event } from '@Nuvio-MCP/ide-core-common';
import { IEditorDocumentModelContentProvider } from '@Nuvio-MCP/ide-editor/lib/browser/index';

@Injectable()
export class MockWalkThroughSnippetSchemeDocumentProvider implements IEditorDocumentModelContentProvider {
  handlesScheme(scheme: string) {
    return scheme === Schemes.walkThroughSnippet;
  }

  provideEditorDocumentModelContent(_uri: URI): MaybePromise<string> {
    return 'test';
  }

  isReadonly(): MaybePromise<boolean> {
    return false;
  }

  private _onDidChangeContent: Emitter<URI> = new Emitter();
  onDidChangeContent: Event<URI> = this._onDidChangeContent.event;

  preferLanguageForUri() {
    return 'plaintext';
  }
}
