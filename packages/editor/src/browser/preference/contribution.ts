import { Domain, PreferenceContribution } from '@Nuvio-MCP/ide-core-browser';

import { editorPreferenceSchema } from './schema';

@Domain(PreferenceContribution)
export class EditorPreferenceContribution implements PreferenceContribution {
  schema = editorPreferenceSchema;
}
