import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { Emitter, Event, IDisposable, ILogger, URI, arrays } from '@Nuvio-MCP/ide-core-browser';

import { IEditor } from '../common';

import { IEditorFeatureContribution, IEditorFeatureRegistry } from './types';

const { addElement } = arrays;

@Injectable()
export class EditorFeatureRegistryImpl implements IEditorFeatureRegistry {
  private contributions: IEditorFeatureContribution[] = [];

  private _onDidRegisterFeature = new Emitter<IEditorFeatureContribution>();

  public readonly onDidRegisterFeature: Event<IEditorFeatureContribution> = this._onDidRegisterFeature.event;

  @Autowired(ILogger)
  logger: ILogger;

  registerEditorFeatureContribution(contribution: IEditorFeatureContribution): IDisposable {
    const disposer = addElement(this.contributions, contribution);
    this._onDidRegisterFeature.fire(contribution);
    return disposer;
  }

  runContributions(editor: IEditor) {
    this.contributions.forEach((contribution) => {
      this.runOneContribution(editor, contribution);
    });
  }

  async runProvideEditorOptionsForUri(uri: URI) {
    const result = await Promise.all(
      this.contributions.map((contribution) => {
        if (contribution.provideEditorOptionsForUri) {
          return contribution.provideEditorOptionsForUri(uri);
        } else {
          return {};
        }
      }),
    );

    return result.reduce(
      (pre, current) => ({
        ...pre,
        ...current,
      }),
      {},
    );
  }

  runOneContribution(editor: IEditor, contribution: IEditorFeatureContribution) {
    try {
      const disposer = contribution.contribute(editor);
      editor.onDispose(() => {
        disposer.dispose();
      });
    } catch (e) {
      this.logger.error(e);
    }
  }
}
