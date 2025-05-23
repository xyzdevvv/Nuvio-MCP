import { localize } from '@Nuvio-MCP/ide-core-common';

import { registerColor } from '../../utils';
import { NOTIFICATIONS_FOREGROUND } from '../notification';

/* --- notification --- */
export const ktNotificationsCloseIconForeground = registerColor(
  'kt.notificationsCloseIcon.foreground',
  {
    dark: NOTIFICATIONS_FOREGROUND,
    light: NOTIFICATIONS_FOREGROUND,
    hcDark: NOTIFICATIONS_FOREGROUND,
    hcLight: NOTIFICATIONS_FOREGROUND,
  },
  localize('notificationsCloseIconForeground', 'Notifications close icon foreground.'),
);
