import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { Deferred } from '@Nuvio-MCP/ide-core-browser';
import { Disposable, DisposableCollection, ILogger } from '@Nuvio-MCP/ide-core-common';

import {
  ExtHostAPIIdentifier,
  ExtensionConnection,
  IInterProcessConnection,
  IInterProcessConnectionService,
} from '../../../common/vscode';

@Injectable({ multiple: true })
export class MainThreadConnection implements IInterProcessConnectionService {
  private proxy: IInterProcessConnection;
  private connections = new Map<string, ExtensionConnection>();
  private connectionsReady = new Map<string, Deferred<void>>();
  private readonly toDispose = new DisposableCollection();

  @Autowired(ILogger)
  protected readonly logger: ILogger;

  constructor(@Optional(IRPCProtocol) private rpcProtocol: IRPCProtocol) {
    this.proxy = this.rpcProtocol.getProxy(ExtHostAPIIdentifier.ExtHostConnection);
  }

  dispose() {
    this.connections.forEach((connection) => {
      connection.dispose();
    });

    this.connections.clear();

    this.toDispose.dispose();
  }
  /**
   * 通过ID获取Connection并发送对应消息
   * @param id
   * @param message
   */
  async $sendMessage(id: string, message: string): Promise<void> {
    const ready = this.connectionsReady.get(id);
    if (ready) {
      await ready.promise;
    }
    if (this.connections.has(id)) {
      this.connections.get(id)!.readMessage(message);
    } else {
      this.logger.warn(`Do not found connection ${id}`);
    }
  }

  /**
   * 创建新的Connection
   * 当链接ID存在时，返回已有Connection
   * @param id
   */
  async $createConnection(id: string): Promise<void> {
    this.logger.log(`create connection ${id}`);
    await this.doEnsureConnection(id);
  }
  /**
   * 根据ID删除Connection
   * @param id
   */
  async $deleteConnection(id: string): Promise<void> {
    this.logger.log(`delete connection ${id}`);
    this.connections.delete(id);
  }

  /**
   * 返回已存在的Connection或创建新的Connection
   * @param id
   */
  async ensureConnection(id: string): Promise<ExtensionConnection> {
    const connection = await this.doEnsureConnection(id);
    await this.proxy.$createConnection(id);
    return connection;
  }

  /**
   * 执行获取/新建Connection操作
   * @param id
   */
  async doEnsureConnection(id: string): Promise<ExtensionConnection> {
    let connection = this.connections.get(id);
    if (!connection) {
      const ready = new Deferred<void>();
      this.connectionsReady.set(id, ready);
      connection = await this.doCreateConnection(id);
      ready.resolve();
      this.connections.set(id, connection);
      this.connectionsReady.delete(id);
    }

    return connection;
  }

  protected async doCreateConnection(id: string): Promise<ExtensionConnection> {
    const connection = new ExtensionConnection(id, this.proxy, () => {
      this.connections.delete(id);
      this.proxy.$deleteConnection(id);
    });

    this.toDispose.push(Disposable.create(() => connection.fireClose()));

    return connection;
  }
}
