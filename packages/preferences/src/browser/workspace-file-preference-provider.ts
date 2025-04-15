import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { URI } from '@Nuvio-MCP/ide-core-browser';
import { PreferenceScope } from '@Nuvio-MCP/ide-core-browser/lib/preferences';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';
import { WorkspaceData } from '@Nuvio-MCP/ide-workspace/lib/browser/workspace-data';

import { AbstractResourcePreferenceProvider } from './abstract-resource-preference-provider';

@Injectable()
export class WorkspaceFilePreferenceProviderOptions {
  workspaceUri: URI;
}

export const WorkspaceFilePreferenceProviderFactory = Symbol('WorkspaceFilePreferenceProviderFactory');
export type WorkspaceFilePreferenceProviderFactory = (
  options: WorkspaceFilePreferenceProviderOptions,
) => WorkspaceFilePreferenceProvider;

@Injectable()
export class WorkspaceFilePreferenceProvider extends AbstractResourcePreferenceProvider {
  @Autowired(IWorkspaceService)
  protected readonly workspaceService: IWorkspaceService;

  @Autowired(WorkspaceFilePreferenceProviderOptions)
  protected readonly options: WorkspaceFilePreferenceProviderOptions;

  protected getUri(): URI {
    return this.options.workspaceUri;
  }

  protected parse(content: string): any {
    const data = super.parse(content);
    if (WorkspaceData.is(data)) {
      return data.settings || {};
    }
    return {};
  }

  protected getPath(preferenceName: string): string[] {
    return ['settings', preferenceName];
  }

  protected getScope(): PreferenceScope {
    return PreferenceScope.Workspace;
  }

  getDomain(): string[] {
    return this.workspaceService.tryGetRoots().map((r) => r.uri);
  }
}
