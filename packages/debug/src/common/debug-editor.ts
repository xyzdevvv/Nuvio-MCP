// eslint-disable-next-line import/no-restricted-paths
import type { ICodeEditor as IMonacoCodeEditor } from '@Nuvio-MCP/ide-monaco/lib/browser/monaco-api/types';
export const DebugEditor = Symbol('DebugEditor');
export type DebugEditor = IMonacoCodeEditor;
