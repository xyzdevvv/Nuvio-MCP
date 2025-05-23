import { localize } from '@Nuvio-MCP/ide-core-common';

import { darken, lighten, registerColor, transparent } from '../../utils';
import { ACTIVITY_BAR_BACKGROUND, ACTIVITY_BAR_BORDER } from '../activity-bar';
import { foreground } from '../base';
import { EDITOR_GROUP_HEADER_TABS_BACKGROUND } from '../editor';
import { PANEL_BACKGROUND, PANEL_INACTIVE_TITLE_FOREGROUND } from '../panel';
import { TAB_INACTIVE_BACKGROUND } from '../tab';
import { textLinkActiveForeground } from '../text';

/* --- panel --- */
export const ktPanelTitleBackground = registerColor(
  'kt.panelTitle.background',
  {
    dark: EDITOR_GROUP_HEADER_TABS_BACKGROUND,
    light: EDITOR_GROUP_HEADER_TABS_BACKGROUND,
    hcDark: EDITOR_GROUP_HEADER_TABS_BACKGROUND,
    hcLight: EDITOR_GROUP_HEADER_TABS_BACKGROUND,
  },
  localize(
    'panelTitle.background',
    'Panel title background color. Panels are shown below the editor area and contain views like output and integrated terminal.',
  ),
);

export const ktPanelTabInactiveForeground = registerColor(
  'kt.panelTab.inactiveForeground',
  {
    dark: transparent(foreground, 0.8),
    light: transparent(foreground, 0.8),
    hcDark: transparent(foreground, 0.8),
    hcLight: transparent(foreground, 0.8),
  },
  localize('panelTab.inactiveForeground', 'Panel tab inactive forground color.'),
);

export const ktPanelTabActiveForeground = registerColor(
  'kt.panelTab.activeForeground',
  {
    dark: textLinkActiveForeground,
    light: textLinkActiveForeground,
    hcDark: textLinkActiveForeground,
    hcLight: textLinkActiveForeground,
  },
  localize('panelTab.activeForeground', 'Panel tab active forground color.'),
);

export const ktPanelTabInactiveBackground = registerColor(
  'kt.panelTab.inactiveBackground',
  {
    dark: TAB_INACTIVE_BACKGROUND,
    light: TAB_INACTIVE_BACKGROUND,
    hcDark: TAB_INACTIVE_BACKGROUND,
    hcLight: TAB_INACTIVE_BACKGROUND,
  },
  localize('panelTab.inactiveBackground', 'Panel tab background color.'),
);

export const ktPanelTabActiveBackground = registerColor(
  'kt.panelTab.activeBackground',
  {
    dark: PANEL_BACKGROUND,
    light: PANEL_BACKGROUND,
    hcDark: PANEL_BACKGROUND,
    hcLight: PANEL_BACKGROUND,
  },
  localize('panelTab.activeBackground', 'Panel tab active background color.'),
);

export const ktPanelTabActionIconForeground = registerColor(
  'kt.panelTabActionIcon.foreground',
  {
    dark: foreground,
    light: foreground,
    hcDark: foreground,
    hcLight: foreground,
  },
  localize('panelTabActionIcon.foreground', 'Panel tab close icon color.'),
);

export const ktPanelTabActiveBorder = registerColor(
  'kt.panelTab.activeBorder',
  {
    dark: lighten(ACTIVITY_BAR_BACKGROUND, 0.2),
    light: lighten(ACTIVITY_BAR_BACKGROUND, 0.2),
    hcDark: lighten(ACTIVITY_BAR_BACKGROUND, 0.2),
    hcLight: lighten(ACTIVITY_BAR_BACKGROUND, 0.2),
  },
  localize('panelTab.border', 'Panel tab border color.'),
);

export const ktPanelTabBorder = registerColor(
  'kt.panelTab.border',
  {
    dark: darken(ACTIVITY_BAR_BORDER, 0.1),
    light: darken(ACTIVITY_BAR_BORDER, 0.1),
    hcDark: darken(ACTIVITY_BAR_BORDER, 0.1),
    hcLight: darken(ACTIVITY_BAR_BORDER, 0.1),
  },
  localize('panelTab.border', 'Panel tab border color.'),
);

export const ktPanelSecondaryForeground = registerColor(
  'kt.panel.secondaryForeground',
  {
    dark: lighten(PANEL_INACTIVE_TITLE_FOREGROUND, 0.2),
    light: lighten(PANEL_INACTIVE_TITLE_FOREGROUND, 0.2),
    hcDark: lighten(PANEL_INACTIVE_TITLE_FOREGROUND, 0.2),
    hcLight: lighten(PANEL_INACTIVE_TITLE_FOREGROUND, 0.2),
  },
  localize('panel.secondaryForeground', 'Panel secondary foreground color.'),
);
