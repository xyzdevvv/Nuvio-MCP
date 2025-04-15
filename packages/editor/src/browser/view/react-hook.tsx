import { useUpdateOnEvent } from '@Nuvio-MCP/ide-core-browser';

import { EditorGroup } from '../workbench-editor.service';

export function useUpdateOnGroupTabChange(editorGroup: EditorGroup) {
  return useUpdateOnEvent(editorGroup.onDidEditorGroupTabChanged, [editorGroup]);
}
