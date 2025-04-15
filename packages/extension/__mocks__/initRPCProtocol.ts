import { RPCServiceCenter, initRPCService } from '@Nuvio-MCP/ide-connection';
import { SimpleConnection } from '@Nuvio-MCP/ide-connection/lib/common/connection/drivers/simple';
import { SumiConnectionMultiplexer } from '@Nuvio-MCP/ide-connection/lib/common/rpc/multiplexer';
import { SumiConnection } from '@Nuvio-MCP/ide-connection/lib/common/rpc/connection';
import { Emitter } from '@Nuvio-MCP/ide-core-common';

export async function initMockRPCProtocol(client): Promise<SumiConnectionMultiplexer> {
  const extProtocol = new SumiConnectionMultiplexer(
    new SimpleConnection({
      onMessage: client.onMessage,
      send: client.send,
    }),
  );

  return extProtocol;
}

export function createMockPairRPCProtocol() {
  const emitterA = new Emitter<any>();
  const emitterB = new Emitter<any>();

  const mockClientA = {
    send: (msg) => emitterB.fire(msg),
    onMessage: emitterA.event,
  };
  const mockClientB = {
    send: (msg) => emitterA.fire(msg),
    onMessage: emitterB.event,
  };

  const rpcProtocolExt = new SumiConnectionMultiplexer(new SimpleConnection(mockClientA));
  const rpcProtocolMain = new SumiConnectionMultiplexer(new SimpleConnection(mockClientB));
  return {
    rpcProtocolExt,
    rpcProtocolMain,
  };
}
