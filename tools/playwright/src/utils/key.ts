import { isMacintosh, isWindows } from '@Nuvio-MCP/ide-utils';

export const keypressWithCmdCtrl = (key: string) => {
  const modifier = isMacintosh ? 'Meta' : isWindows ? 'Ctrl' : 'Control';
  return `${modifier}+${key}`;
};

export const keypressWithCmdCtrlAndShift = (key: string) => {
  const modifier = isMacintosh ? 'Meta' : isWindows ? 'Ctrl' : 'Control';
  return `${modifier}+Shift+${key}`;
};
