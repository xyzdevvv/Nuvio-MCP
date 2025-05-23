import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { IContextKey, IContextKeyService, IScopedContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import { TestingIsPeekVisible } from '@Nuvio-MCP/ide-core-browser/lib/contextkey/testing';
import { ContextKeyService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/contextkey/browser/contextKeyService';
import { IContextKeyServiceTarget } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/contextkey/common/contextkey';

@Injectable()
export class TestContextKey {
  @Autowired(IContextKeyService)
  private readonly globalContextKeyService: IContextKeyService;

  private _contextKeyService: IScopedContextKeyService | undefined;

  public readonly contextTestingIsPeekVisible: IContextKey<boolean>;

  constructor(@Optional() dom?: HTMLElement | IContextKeyServiceTarget | ContextKeyService) {
    this._contextKeyService = this.globalContextKeyService.createScoped(dom);
    this.contextTestingIsPeekVisible = TestingIsPeekVisible.bind(this.contextKeyScoped);
  }

  public get contextKeyScoped(): IScopedContextKeyService {
    return this._contextKeyService!;
  }
}
