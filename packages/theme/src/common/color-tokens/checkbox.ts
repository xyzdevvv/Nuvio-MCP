import { localize } from '@Nuvio-MCP/ide-core-common';

import { registerColor } from '../utils';

import { selectBackground, selectBorder, selectForeground } from './dropdown';

export const checkboxBorder = registerColor(
  'checkbox.border',
  { dark: selectBorder, light: selectBorder, hcDark: selectBorder, hcLight: selectBorder },
  localize('checkbox.border', 'Border color of checkbox widget.'),
);
export const checkboxBackground = registerColor(
  'checkbox.background',
  { dark: selectBackground, light: selectBackground, hcDark: selectBackground, hcLight: selectBackground },
  localize('checkbox.background', 'Background color of checkbox widget.'),
);
export const checkboxForeground = registerColor(
  'checkbox.foreground',
  { dark: selectForeground, light: selectForeground, hcDark: selectForeground, hcLight: selectForeground },
  localize('checkbox.foreground', 'Foreground color of checkbox widget.'),
);
