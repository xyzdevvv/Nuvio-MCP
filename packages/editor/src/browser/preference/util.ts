import { PreferenceService, createPreferenceProxy } from '@Nuvio-MCP/ide-core-browser';

import { EditorPreferences, editorPreferenceSchema } from './schema';

export function createEditorPreferenceProxy(
  preferenceService: PreferenceService,
  resourceUri: string,
  overrideIdentifier: string,
): EditorPreferences {
  return createPreferenceProxy(preferenceService, editorPreferenceSchema, {
    resourceUri,
    overrideIdentifier,
  });
}
