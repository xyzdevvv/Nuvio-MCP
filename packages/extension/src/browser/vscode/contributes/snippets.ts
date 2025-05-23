import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { LifeCyclePhase } from '@Nuvio-MCP/ide-core-common';
import { MonacoSnippetSuggestProvider } from '@Nuvio-MCP/ide-monaco/lib/browser/monaco-snippet-suggest-provider';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';
import { AbstractExtInstanceManagementService } from '../../types';

export interface SnippetContribution {
  path: string;
  source: string;
  language?: string;
}
export type SnippetSchema = Array<SnippetContribution>;

@Injectable()
@Contributes('snippets')
@LifeCycle(LifeCyclePhase.Ready)
export class SnippetsContributionPoint extends VSCodeContributePoint<SnippetSchema> {
  @Autowired(MonacoSnippetSuggestProvider)
  protected readonly snippetSuggestProvider: MonacoSnippetSuggestProvider;

  @Autowired(AbstractExtInstanceManagementService)
  protected readonly extensionManageService: AbstractExtInstanceManagementService;

  contribute() {
    for (const contrib of this.contributesMap) {
      const { extensionId, contributes } = contrib;
      const extension = this.extensionManageService.getExtensionInstanceByExtId(extensionId);
      if (!extension) {
        continue;
      }
      for (const snippet of contributes) {
        this.addDispose(
          this.snippetSuggestProvider.fromPath(snippet.path, {
            extPath: extension.path,
            language: snippet.language,
            source: extension.packageJSON.name,
          }),
        );
      }
    }
    this.addDispose(this.snippetSuggestProvider.registerSnippetsProvider());
  }
}
