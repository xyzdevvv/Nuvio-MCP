import { PreferenceSchema } from '@Nuvio-MCP/ide-core-browser';

import { taskSchemaUri } from './task.schema';

export const taskPreferencesSchema: PreferenceSchema = {
  type: 'object',
  scope: 'resource',
  properties: {
    tasks: {
      $ref: taskSchemaUri,
      defaultValue: { tasks: [] },
    },
  },
};
