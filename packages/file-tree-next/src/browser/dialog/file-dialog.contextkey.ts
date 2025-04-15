import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IContextKey, IContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import { FileDialogViewVisibleContext } from '@Nuvio-MCP/ide-core-browser/lib/contextkey';

@Injectable()
export class FileDialogContextKey {
  @Autowired(IContextKeyService)
  private readonly globalContextKeyService: IContextKeyService;

  public fileDialogViewVisibleContext: IContextKey<boolean>;
  private _contextKeyService: IContextKeyService;

  initScopedContext(dom: HTMLDivElement) {
    this._contextKeyService = this.globalContextKeyService.createScoped(dom);
    this.fileDialogViewVisibleContext = FileDialogViewVisibleContext.bind(this._contextKeyService);
  }

  get service() {
    return this._contextKeyService;
  }
}
