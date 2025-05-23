import { Injectable } from '@Nuvio-MCP/di';
import { IDisposable, URI } from '@Nuvio-MCP/ide-core-common';

/**
 * @class StaticResourceService 静态资源转换服务
 * @description
 * 对于一些静态资源的展示，如图片，插件中的资源等等，在 IDE 中往往会以类似 file 协议的 uri 进行描述。
 *
 * 在 WebIDE 环境，我们无法将它直接挂载在对应的 html 标签或者 css 中。
 * 因此在使用之前，需要将这些资源的 URI 转换为浏览器可以访问的资源。
 *
 * 在 Electron 中，由于 File 协议能直接访问，一般来说无需注册资源地址转换。
 */
@Injectable()
export abstract class StaticResourceService {
  /**
   * 注册一个静态资源转换方式的提供方
   * @param provider
   */
  public abstract registerStaticResourceProvider(provider: IStaticResourceProvider): IDisposable;

  /**
   * 将 URI 资源转换为静态资源
   * 通常比如在 WebIDE 场景, 会将插件的 `file://` 路径，转换为某个静态服务的 uri 进行访问
   * @param uri 待转换的 uri
   * @returns 转换后的 uri
   */
  public abstract resolveStaticResource(uri: URI): URI;

  /**
   * 被转换后的uri将会拥有哪些host,
   * 用于webview的cspResource字段,
   * webview需要能够知道什么样的资源是可以被访问的。
   *
   * 例: ['http://127.0.0.1:8000']
   */
  public readonly resourceRoots: Set<string>;
}

/**
 * 提供静态资源转换方式的提供方
 */
export interface IStaticResourceProvider {
  /**
   * 能够处理的scheme，单个scheme只能有一个StaticResourceProvider， 先来的会被后来的覆盖
   */
  scheme: string;

  /**
   * 定义如何处理uri的转换
   * @param uri 待转换的uri
   */
  resolveStaticResource(uri: URI): URI;

  /**
   * resolve后提供的外部资源的host路径， 会传入StaticResourceService的resourceRoots中
   *
   * 例: ['http://0.0.0.0:8000']
   */
  roots?: string[];
}

export const StaticResourceContribution = Symbol('StaticResourceContribution');

export const StaticResourceContributionProvider = Symbol('StaticResourceContributionProvider');

export interface StaticResourceContribution {
  registerStaticResolver(service: StaticResourceService): void;
}
