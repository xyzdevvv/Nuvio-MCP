import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { Disposable, IDisposable } from '@Nuvio-MCP/ide-core-common';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { EditorComponentRegistry } from '@Nuvio-MCP/ide-editor/lib/browser';
import { WorkbenchEditorServiceImpl } from '@Nuvio-MCP/ide-editor/lib/browser/workbench-editor.service';

import { AbstractSumiBrowserContributionRunner, IEditorSideViewContribution, IRunTimeParams } from '../types';

@Injectable({ multiple: true })
export class EditorSideBrowserContributionRunner extends AbstractSumiBrowserContributionRunner {
  @Autowired(EditorComponentRegistry)
  editorComponentRegistry: EditorComponentRegistry;

  @Autowired(WorkbenchEditorService)
  private readonly editorService: WorkbenchEditorServiceImpl;

  run(param: IRunTimeParams): IDisposable {
    const disposer = new Disposable();
    const editorSide = this.contribution.editorSide;

    if (editorSide) {
      editorSide.view.forEach((component) => {
        disposer.addDispose(this.registerEditorSideComponent(component, param));
      });
    }

    return disposer;
  }

  registerEditorSideComponent(viewContribution: IEditorSideViewContribution, runParam: IRunTimeParams): IDisposable {
    const disposer = new Disposable();
    const { extendProtocol, extendService } = runParam.getExtensionExtendService(this.extension, viewContribution.id);

    disposer.addDispose(
      this.editorComponentRegistry.registerEditorSideWidget({
        id: viewContribution.id,
        side: viewContribution.side,
        component: viewContribution.component,
        initialProps: {
          kaitianExtendService: extendService,
          kaitianExtendSet: extendProtocol,
          sumiExtendService: extendService,
          sumiExtendSet: extendProtocol,
        },
        displaysOnResource: () => this.editorService.editorContextKeyService.match(viewContribution?.when),
      }),
    );

    return disposer;
  }
}
