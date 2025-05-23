import { localize } from '@Nuvio-MCP/ide-core-common';

import { registerColor, transparent } from '../../utils';
import { ACTIVITY_BAR_BORDER } from '../activity-bar';
import { descriptionForeground, foreground, widgetShadow } from '../base';
import { editorBackground } from '../editor';
import { menuForeground } from '../menu';

/* ---  menu --- */
export const menuDescriptionForeground = registerColor(
  'kt.menu.descriptionForeground',
  {
    dark: descriptionForeground,
    light: descriptionForeground,
    hcDark: descriptionForeground,
    hcLight: descriptionForeground,
  },
  localize('menuDescriptionForeground', 'Description foreground color of menu items.'),
);

export const menuDisableForeground = registerColor(
  'kt.menu.disableForeground',
  {
    dark: transparent(menuForeground, 0.3),
    light: transparent(menuForeground, 0.3),
    hcDark: transparent(menuForeground, 0.3),
    hcLight: transparent(menuForeground, 0.3),
  },
  localize('menuDisableForeground', 'Foreground color of disabled menu items.'),
);

export const menuShadow = registerColor(
  'kt.menu.shadow',
  { dark: widgetShadow, light: widgetShadow, hcDark: widgetShadow, hcLight: widgetShadow },
  localize('menuShadow', 'Box shadow color of menu.'),
);

/* --- menubar --- */
export const menubarForeground = registerColor(
  'kt.menubar.foreground',
  { dark: foreground, light: foreground, hcDark: foreground, hcLight: foreground },
  localize('menubarForeground', 'Foreground color of menu bar.'),
);

export const menubarBackground = registerColor(
  'kt.menubar.background',
  { dark: editorBackground, light: editorBackground, hcDark: editorBackground, hcLight: editorBackground },
  localize('menubarBackground', 'Background color of menu bar.'),
);

export const menubarSeparatorBackground = registerColor(
  'kt.menubar.separatorBackground',
  { dark: null, light: null, hcDark: null, hcLight: null },
  localize('menubarSeparatorBackground', 'Separator background of menu bar.'),
);

export const menubarBorder = registerColor(
  'kt.menubar.border',
  { dark: ACTIVITY_BAR_BORDER, light: ACTIVITY_BAR_BORDER, hcDark: ACTIVITY_BAR_BORDER, hcLight: ACTIVITY_BAR_BORDER },
  localize('menubarBorder', 'Border color of menu bar.'),
);
