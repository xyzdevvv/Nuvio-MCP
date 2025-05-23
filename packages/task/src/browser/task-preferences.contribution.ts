import { Domain, PreferenceConfiguration, PreferenceContribution, PreferenceSchema } from '@Nuvio-MCP/ide-core-browser';

import { taskPreferencesSchema } from './task-preferences';

@Domain(PreferenceContribution, PreferenceConfiguration)
export class TaskPreferencesContribution implements PreferenceContribution, PreferenceConfiguration {
  schema: PreferenceSchema = taskPreferencesSchema;
  name = 'tasks';
}
