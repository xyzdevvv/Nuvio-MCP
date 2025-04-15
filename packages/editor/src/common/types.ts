import * as monaco from '@Nuvio-MCP/ide-monaco';

export interface IDocModelUpdateOptions extends monaco.editor.ITextModelUpdateOptions {
  detectIndentation?: boolean;
}
