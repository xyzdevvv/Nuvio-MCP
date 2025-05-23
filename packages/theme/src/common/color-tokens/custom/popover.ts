import { localize } from '@Nuvio-MCP/ide-core-common';

import { registerColor } from '../../utils';
import { NOTIFICATIONS_BACKGROUND, NOTIFICATIONS_FOREGROUND } from '../notification';

export const ktPopoverForground = registerColor(
  'kt.popover.foreground',
  { dark: '#D7DBDE', light: '#4D4D4D', hcDark: NOTIFICATIONS_FOREGROUND, hcLight: NOTIFICATIONS_FOREGROUND },
  localize('Popover foreground color. Popover when hover a icon or link to show some informations'),
);

export const ktPopoverBackground = registerColor(
  'kt.popover.background',
  { dark: '#35393D', light: '#FFFFFF', hcDark: NOTIFICATIONS_BACKGROUND, hcLight: NOTIFICATIONS_BACKGROUND },
  localize('Popover background color. Popover when hover a icon or link to show some informations'),
);

export const ktPopoverBorder = registerColor(
  'kt.popover.border',
  { dark: '#2c3033', light: '#E0E0E0', hcDark: NOTIFICATIONS_BACKGROUND, hcLight: NOTIFICATIONS_BACKGROUND },
  localize('Popover border color.'),
);

export const ktPopoverProminentBackground = registerColor(
  'kt.popover.prominentBackground',
  { dark: '#2C3033', light: '#F2F2F2', hcDark: NOTIFICATIONS_BACKGROUND, hcLight: NOTIFICATIONS_BACKGROUND },
  localize('Popover prominent background color.'),
);
