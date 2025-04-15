import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IContextKey, IContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import {
  MarkerFocusContextKey,
  MarkersTreeVisibilityContextKey,
} from '@Nuvio-MCP/ide-core-browser/lib/contextkey/markers';

@Injectable()
export class MarkersContextKey {
  @Autowired(IContextKeyService)
  private readonly globalContextkeyService: IContextKeyService;

  public markersTreeVisibility: IContextKey<boolean>;
  public markerFocus: IContextKey<boolean>;

  private _contextKeyService: IContextKeyService;

  initScopedContext(dom: HTMLDivElement) {
    this._contextKeyService = this.globalContextkeyService.createScoped(dom);
    this.markersTreeVisibility = MarkersTreeVisibilityContextKey.bind(this._contextKeyService);
    this.markerFocus = MarkerFocusContextKey.bind(this._contextKeyService);
  }

  get service() {
    return this._contextKeyService;
  }
}
