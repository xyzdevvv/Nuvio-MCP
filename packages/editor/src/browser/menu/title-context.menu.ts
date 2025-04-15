import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import { ResourceContextKey } from '@Nuvio-MCP/ide-core-browser/lib/contextkey/resource';
import { AbstractContextMenuService, ICtxMenuRenderer, MenuId } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { URI } from '@Nuvio-MCP/ide-core-common';

import { IEditorGroup } from '../../common';
import { EditorGroup } from '../workbench-editor.service';

@Injectable()
export class TabTitleMenuService {
  @Autowired(AbstractContextMenuService)
  ctxMenuService: AbstractContextMenuService;

  @Autowired(ICtxMenuRenderer)
  ctxMenuRenderer: ICtxMenuRenderer;

  @Autowired(IContextKeyService)
  contextKeyService: IContextKeyService;

  private _editorTitleContextKey;

  private get editorTitleContextKey() {
    if (!this._editorTitleContextKey) {
      this._editorTitleContextKey = this.contextKeyService.createKey('editorTitleContext', false);
    }
    return this._editorTitleContextKey;
  }

  show(x: number, y: number, uri: URI, group: IEditorGroup) {
    // 设置resourceScheme
    const titleContext = (group as EditorGroup).contextKeyService.createScoped();
    const resourceContext = new ResourceContextKey(titleContext);
    resourceContext.set(uri);
    this.editorTitleContextKey.set(true);

    const menus = this.ctxMenuService.createMenu({
      id: MenuId.EditorTitleContext,
      contextKeyService: titleContext,
    });
    const menuNodes = menus.getMergedMenuNodes();
    menus.dispose();
    titleContext.dispose();

    this.ctxMenuRenderer.show({
      anchor: { x, y },
      menuNodes,
      args: [{ uri, group }],
      onHide: () => {
        this.editorTitleContextKey.set(false);
      },
    });
  }
}
