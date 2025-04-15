import { Autowired, Injectable } from '@Nuvio-MCP/di';
import {
  DisposableCollection,
  DisposableStore,
  Emitter,
  FileDecorationsProvider,
  IFileDecoration,
  URI,
  Uri,
} from '@Nuvio-MCP/ide-core-browser';
import { IDecorationsService } from '@Nuvio-MCP/ide-decoration';
import { IThemeService } from '@Nuvio-MCP/ide-theme';

@Injectable()
export class SCMTreeDecorationService implements FileDecorationsProvider {
  @Autowired(IDecorationsService)
  private readonly decorationsService: IDecorationsService;

  @Autowired(IThemeService)
  public readonly themeService: IThemeService;

  private disposeCollection: DisposableStore = new DisposableStore();

  private readonly onDidChangeEmitter: Emitter<void> = this.disposeCollection.add(new Emitter());

  constructor() {
    this.disposeCollection.addAll([
      this.decorationsService.onDidChangeDecorations(() => {
        this.onDidChangeEmitter.fire();
      }),
      this.themeService.onThemeChange(() => {
        this.onDidChangeEmitter.fire();
      }),
    ]);
  }

  get onDidChange() {
    return this.onDidChangeEmitter.event;
  }

  getDecoration(uri, hasChildren = false) {
    // 转换URI为vscode.uri
    if (uri instanceof URI) {
      uri = Uri.parse(uri.toString());
    }
    const decoration = this.decorationsService.getDecoration(uri, hasChildren);
    if (decoration) {
      return {
        ...decoration,
        // 通过ThemeService获取颜色值
        color: this.themeService.getColor({ id: decoration.color as string }),
      } as IFileDecoration;
    }
    return {
      color: '',
      tooltip: '',
      badge: '',
    } as IFileDecoration;
  }

  dispose() {
    this.disposeCollection.dispose();
  }
}
