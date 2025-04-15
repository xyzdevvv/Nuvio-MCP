import { Type } from '@furyjs/fury';

import { UriComponentsProto } from '@Nuvio-MCP/ide-connection/lib/common/protocols/common';
import { TSumiProtocol } from '@Nuvio-MCP/ide-connection/lib/common/rpc';

import { DiskFileServicePath } from '../tokens';

export const DiskFileServiceProtocol = {
  name: DiskFileServicePath,
  methods: [
    {
      method: 'readFile',
      request: [
        {
          name: 'uri',
          type: UriComponentsProto,
        },
      ],
      response: {
        type: Type.binary(),
      },
    },
  ],
} as TSumiProtocol;
