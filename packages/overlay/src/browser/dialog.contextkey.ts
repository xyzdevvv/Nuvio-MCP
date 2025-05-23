import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IContextKey, IContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import { DialogViewVisibleContext } from '@Nuvio-MCP/ide-core-browser/lib/contextkey/dialog';

@Injectable()
export class DialogContextKey {
  @Autowired(IContextKeyService)
  private readonly globalContextKeyService: IContextKeyService;

  public readonly dialogViewVisibleContext: IContextKey<boolean>;

  private readonly _contextKeyService: IContextKeyService;

  constructor() {
    this._contextKeyService = this.globalContextKeyService;
    this.dialogViewVisibleContext = DialogViewVisibleContext.bind(this._contextKeyService);
  }
}
