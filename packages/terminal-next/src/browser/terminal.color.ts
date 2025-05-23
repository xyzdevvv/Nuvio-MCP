import { localize } from '@Nuvio-MCP/ide-core-common';
import {
  ColorDefaults,
  ColorIdentifier,
  PANEL_BACKGROUND,
  PANEL_BORDER,
  editorFindMatch,
  editorFindMatchHighlight,
  overviewRulerFindMatchForeground,
  registerColor,
  transparent,
} from '@Nuvio-MCP/ide-theme';

// copied from vscode terminal color registry

/**
 * The color identifiers for the terminal's ansi colors. The index in the array corresponds to the index
 * of the color in the terminal color table.
 */
export const ansiColorIdentifiers: ColorIdentifier[] = [];

export const TERMINAL_BACKGROUND_COLOR = registerColor(
  'terminal.background',
  {
    dark: PANEL_BACKGROUND,
    light: PANEL_BACKGROUND,
    hcDark: PANEL_BACKGROUND,
    hcLight: PANEL_BACKGROUND,
  },
  localize(
    'terminal.background',
    'The background color of the terminal, this allows coloring the terminal differently to the panel.',
  ),
);

export const TERMINAL_FOREGROUND_COLOR = registerColor(
  'terminal.foreground',
  {
    light: '#333333',
    dark: '#CCCCCC',
    hcDark: '#FFFFFF',
    hcLight: '#292929',
  },
  localize('terminal.foreground', 'The foreground color of the terminal.'),
);

export const TERMINAL_CURSOR_FOREGROUND_COLOR = registerColor(
  'terminalCursor.foreground',
  null,
  localize('terminalCursor.foreground', 'The foreground color of the terminal cursor.'),
);

export const TERMINAL_CURSOR_BACKGROUND_COLOR = registerColor(
  'terminalCursor.background',
  null,
  localize(
    'terminalCursor.background',
    'The background color of the terminal cursor. Allows customizing the color of a character overlapped by a block cursor.',
  ),
);

export const TERMINAL_SELECTION_BACKGROUND_COLOR = registerColor(
  'terminal.selectionBackground',
  {
    light: '#ADD6FF',
    dark: '#264F78',
    hcDark: '#F3F518',
    hcLight: '#0F4A85',
  },
  localize('terminal.selectionBackground', 'The selection background color of the terminal.'),
);

export const TERMINAL_SELECTION_FOREGROUND_COLOR = registerColor(
  'terminal.selectionForeground',
  {
    light: null,
    dark: null,
    hcDark: '#000000',
    hcLight: '#ffffff',
  },
  localize(
    'terminal.selectionForeground',
    'The selection foreground color of the terminal. When this is null the selection foreground will be retained and have the minimum contrast ratio feature applied.',
  ),
);

export const TERMINAL_INACTIVE_SELECTION_BACKGROUND_COLOR = registerColor(
  'terminal.inactiveSelectionBackground',
  {
    light: transparent(TERMINAL_SELECTION_BACKGROUND_COLOR, 0.5),
    dark: transparent(TERMINAL_SELECTION_BACKGROUND_COLOR, 0.5),
    hcDark: transparent(TERMINAL_SELECTION_BACKGROUND_COLOR, 0.7),
    hcLight: transparent(TERMINAL_SELECTION_BACKGROUND_COLOR, 0.5),
  },
  localize(
    'terminal.inactiveSelectionBackground',
    'The selection background color of the terminal when it does not have focus.',
  ),
);

export const TERMINAL_BORDER_COLOR = registerColor(
  'terminal.border',
  {
    dark: PANEL_BORDER,
    light: PANEL_BORDER,
    hcDark: PANEL_BORDER,
    hcLight: PANEL_BORDER,
  },
  localize(
    'terminal.border',
    'The color of the border that separates split panes within the terminal. This defaults to panel.border.',
  ),
);

export const TERMINAL_FIND_MATCH_BACKGROUND_COLOR = registerColor(
  'terminal.findMatchBackground',
  {
    dark: null,
    light: null,
    hcDark: null,
    hcLight: '#0F4A85',
  },
  localize(
    'terminal.findMatchBackground',
    'Color of the current search match in the terminal. The color must not be opaque so as not to hide underlying terminal content.',
  ),
);

export const TERMINAL_FIND_MATCH_BORDER_COLOR = registerColor(
  'terminal.findMatchBorder',
  {
    dark: editorFindMatch,
    light: editorFindMatch,
    hcDark: '#f38518',
    hcLight: '#0F4A85',
  },
  localize('terminal.findMatchBorder', 'Border color of the current search match in the terminal.'),
);

export const TERMINAL_FIND_MATCH_HIGHLIGHT_BACKGROUND_COLOR = registerColor(
  'terminal.findMatchHighlightBackground',
  {
    dark: null,
    light: null,
    hcDark: null,
    hcLight: null,
  },
  localize(
    'terminal.findMatchHighlightBackground',
    'Color of the other search matches in the terminal. The color must not be opaque so as not to hide underlying terminal content.',
  ),
);

export const TERMINAL_FIND_MATCH_HIGHLIGHT_BORDER_COLOR = registerColor(
  'terminal.findMatchHighlightBorder',
  {
    dark: editorFindMatchHighlight,
    light: editorFindMatchHighlight,
    hcDark: '#f38518',
    hcLight: '#0F4A85',
  },
  localize('terminal.findMatchHighlightBorder', 'Border color of the other search matches in the terminal.'),
);

export const TERMINAL_OVERVIEW_RULER_FIND_MATCH_FOREGROUND_COLOR = registerColor(
  'terminalOverviewRuler.findMatchForeground',
  {
    dark: overviewRulerFindMatchForeground,
    light: overviewRulerFindMatchForeground,
    hcDark: '#f38518',
    hcLight: '#0F4A85',
  },
  localize(
    'terminalOverviewRuler.findMatchHighlightForeground',
    'Overview ruler marker color for find matches in the terminal.',
  ),
);

export const TERMINAL_OVERVIEW_RULER_CURSOR_FOREGROUND_COLOR = registerColor(
  'terminalOverviewRuler.cursorForeground',
  {
    dark: '#A0A0A0CC',
    light: '#A0A0A0CC',
    hcDark: '#A0A0A0CC',
    hcLight: '#A0A0A0CC',
  },
  localize('terminalOverviewRuler.cursorForeground', 'The overview ruler cursor color.'),
);

export const ansiColorMap: { [key: string]: { index: number; defaults: ColorDefaults } } = {
  'terminal.ansiBlack': {
    index: 0,
    defaults: {
      light: '#000000',
      dark: '#000000',
      hcDark: '#000000',
      hcLight: '#292929',
    },
  },
  'terminal.ansiRed': {
    index: 1,
    defaults: {
      light: '#cd3131',
      dark: '#cd3131',
      hcDark: '#cd0000',
      hcLight: '#cd3131',
    },
  },
  'terminal.ansiGreen': {
    index: 2,
    defaults: {
      light: '#00BC00',
      dark: '#0DBC79',
      hcDark: '#00cd00',
      hcLight: '#00bc00',
    },
  },
  'terminal.ansiYellow': {
    index: 3,
    defaults: {
      light: '#949800',
      dark: '#e5e510',
      hcDark: '#cdcd00',
      hcLight: '#949800',
    },
  },
  'terminal.ansiBlue': {
    index: 4,
    defaults: {
      light: '#0451a5',
      dark: '#2472c8',
      hcDark: '#cd00cd',
      hcLight: '#bc05bc',
    },
  },
  'terminal.ansiMagenta': {
    index: 5,
    defaults: {
      light: '#bc05bc',
      dark: '#bc3fbc',
      hcDark: '#cd00cd',
      hcLight: '#bc05bc',
    },
  },
  'terminal.ansiCyan': {
    index: 6,
    defaults: {
      light: '#0598bc',
      dark: '#11a8cd',
      hcDark: '#00cdcd',
      hcLight: '#0598b',
    },
  },
  'terminal.ansiWhite': {
    index: 7,
    defaults: {
      light: '#555555',
      dark: '#e5e5e5',
      hcDark: '#e5e5e5',
      hcLight: '#555555',
    },
  },
  'terminal.ansiBrightBlack': {
    index: 8,
    defaults: {
      light: '#666666',
      dark: '#666666',
      hcDark: '#7f7f7f',
      hcLight: '#666666',
    },
  },
  'terminal.ansiBrightRed': {
    index: 9,
    defaults: {
      light: '#cd3131',
      dark: '#f14c4c',
      hcDark: '#ff0000',
      hcLight: '#cd3131',
    },
  },
  'terminal.ansiBrightGreen': {
    index: 10,
    defaults: {
      light: '#14CE14',
      dark: '#23d18b',
      hcDark: '#00ff00',
      hcLight: '#00bc00',
    },
  },
  'terminal.ansiBrightYellow': {
    index: 11,
    defaults: {
      light: '#b5ba00',
      dark: '#f5f543',
      hcDark: '#ffff00',
      hcLight: '#b5ba00',
    },
  },
  'terminal.ansiBrightBlue': {
    index: 12,
    defaults: {
      light: '#0451a5',
      dark: '#3b8eea',
      hcDark: '#5c5cff',
      hcLight: '#0451a5',
    },
  },
  'terminal.ansiBrightMagenta': {
    index: 13,
    defaults: {
      light: '#bc05bc',
      dark: '#d670d6',
      hcDark: '#ff00ff',
      hcLight: '#bc05bc',
    },
  },
  'terminal.ansiBrightCyan': {
    index: 14,
    defaults: {
      light: '#0598bc',
      dark: '#29b8db',
      hcDark: '#00ffff',
      hcLight: '#0598bc',
    },
  },
  'terminal.ansiBrightWhite': {
    index: 15,
    defaults: {
      light: '#a5a5a5',
      dark: '#e5e5e5',
      hcDark: '#ffffff',
      hcLight: '#a5a5a5',
    },
  },
};

export function registerTerminalColors(): void {
  Object.keys(ansiColorMap).forEach((id) => {
    const entry = ansiColorMap[id];
    const colorName = id.substring(13);
    ansiColorIdentifiers[entry.index] = registerColor(
      id,
      entry.defaults,
      localize('terminal.ansiColor', "'{0}' ANSI color in the terminal.", colorName),
    );
  });
}
