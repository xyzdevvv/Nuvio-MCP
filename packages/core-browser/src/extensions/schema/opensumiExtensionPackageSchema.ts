import { localize } from '@Nuvio-MCP/ide-core-common';

export const Nuvio-MCPExtensionPackageSchema = {
  properties: {
    sumiContributes: {
      description: localize('sumiContributes.contributes'),
      type: 'object',
      properties: {} as { [key: string]: any },
      default: {},
    },
  },
};
