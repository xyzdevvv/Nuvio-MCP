import { Type } from '@furyjs/fury';

import { CommonServerPath } from '@Nuvio-MCP/ide-core-common';

import type { TSumiProtocol } from '../rpc';

export const CommonServerProtocol = {
  name: CommonServerPath,
  methods: [
    {
      method: 'getBackendOS',
      request: [],
      response: {
        type: Type.uint16(),
      },
    },
  ],
} as TSumiProtocol;
