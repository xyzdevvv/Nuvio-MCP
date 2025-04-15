import { Autowired } from '@Nuvio-MCP/di';
import { ClientAppContribution, Domain, RecentFilesManager, URI, localize } from '@Nuvio-MCP/ide-core-browser';
import { IResource, ResourceService, WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import {
  BrowserEditorContribution,
  EditorComponentRegistry,
  EditorComponentRenderMode,
  EditorOpenType,
} from '@Nuvio-MCP/ide-editor/lib/browser';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { IWelcomeMetaData } from './common';
import { EditorWelcomeComponent } from './welcome';

@Domain(BrowserEditorContribution, ClientAppContribution)
export class WelcomeContribution implements BrowserEditorContribution, ClientAppContribution {
  @Autowired(IWorkspaceService)
  private readonly workspaceService: IWorkspaceService;

  @Autowired(WorkbenchEditorService)
  private readonly editorService: WorkbenchEditorService;

  @Autowired(RecentFilesManager)
  private readonly recentFilesManager: RecentFilesManager;

  registerEditorComponent(registry: EditorComponentRegistry) {
    registry.registerEditorComponent({
      uid: 'welcome',
      scheme: 'welcome',
      component: EditorWelcomeComponent,
      renderMode: EditorComponentRenderMode.ONE_PER_WORKBENCH,
    });
    registry.registerEditorComponentResolver('welcome', (resource, results) => {
      results.push({
        type: EditorOpenType.component,
        componentId: 'welcome',
      });
    });
  }

  registerResource(service: ResourceService) {
    service.registerResourceProvider({
      scheme: 'welcome',
      provideResource: async (uri: URI): Promise<IResource<IWelcomeMetaData>> =>
        Promise.all([
          this.workspaceService.getMostRecentlyUsedWorkspaces(),
          this.recentFilesManager.getMostRecentlyOpenedFiles(),
        ]).then(([workspaces, files]) => ({
          uri,
          name: localize('welcome.title'),
          icon: '',
          metadata: {
            recentWorkspaces: workspaces || [],
            recentFiles: files || [],
          },
        })),
    });
  }

  onDidStart() {
    if (!this.workspaceService.workspace) {
      this.editorService.open(new URI('welcome://'));
    }
  }
}
