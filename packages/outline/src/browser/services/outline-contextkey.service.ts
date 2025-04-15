import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { IContextKey, IContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import { OutlineFollowCursorContext, OutlineSortTypeContext } from '@Nuvio-MCP/ide-core-browser/lib/contextkey';

@Injectable()
export class OutlineContextKeyService {
  @Autowired(IContextKeyService)
  private readonly globalContextKeyService: IContextKeyService;

  public readonly outlineSortTypeContext: IContextKey<number>;
  public readonly outlineFollowCursorContext: IContextKey<boolean>;

  constructor(@Optional() contextKeyService: IContextKeyService) {
    contextKeyService = contextKeyService || this.globalContextKeyService;
    this.outlineSortTypeContext = OutlineSortTypeContext.bind(contextKeyService);
    this.outlineFollowCursorContext = OutlineFollowCursorContext.bind(contextKeyService);
  }
}
