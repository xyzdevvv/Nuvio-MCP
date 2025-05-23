import { localize } from '@Nuvio-MCP/ide-core-common';

import { registerColor, transparent } from '../../utils';
import { foreground, iconForeground } from '../base';
import { editorErrorForeground, editorInfoForeground, editorWarningForeground } from '../editor';

// base custom colors
// 强调色
export const accentForeground = registerColor(
  'kt.accentForeground',
  { dark: foreground, light: foreground, hcDark: foreground, hcLight: foreground },
  localize('accentForeground', 'Accent foreground color. This color is only used if not overridden by a component.'),
);

export const disableForeground = registerColor(
  'kt.disableForeground',
  {
    light: transparent(foreground, 0.3),
    dark: transparent(foreground, 0.3),
    hcDark: transparent(foreground, 0.3),
    hcLight: transparent(foreground, 0.3),
  },
  localize('disableForeground', 'Foreground color for text providing disabled information'),
);

export const iconSecondaryForeground = registerColor(
  'kt.icon.secondaryForeground',
  { dark: iconForeground, light: iconForeground, hcDark: iconForeground, hcLight: iconForeground },
  localize('secondaryForeground', 'The secondary color for icons in the workbench.'),
);

export const errorIconForeground = registerColor(
  'kt.errorIconForeground',
  {
    dark: editorErrorForeground,
    light: editorErrorForeground,
    hcDark: editorErrorForeground,
    hcLight: editorErrorForeground,
  },
  localize('errorIconForeground', 'Foreground color for error icon'),
);

export const errorBackground = registerColor(
  'kt.errorBackground',
  { dark: '#D21F2840', light: '#FF787540', hcDark: null, hcLight: null },
  localize('errorBackground', 'Background color for error text'),
);

/**
 * 备注: 为保障对 vscode theme 插件的最大程度兼容
 * 这里 [warning/error/info]IconForeground
 * 皆 fallback 到 vscode token 中 notificationsIcon 相关的默认值
 * 即全部 fallback 搭配 editorForeground 色值
 */
export const warningIconForeground = registerColor(
  'kt.warningIconForeground',
  {
    dark: editorWarningForeground,
    light: editorWarningForeground,
    hcDark: editorWarningForeground,
    hcLight: editorWarningForeground,
  },
  localize('warningIconForeground', 'Foreground color for warning icon'),
);

export const warningBackground = registerColor(
  'kt.warningBackground',
  { dark: '#D7951340', light: '#FFD66640', hcDark: null, hcLight: null },
  localize('warningBackground', 'Background color for warning text'),
);

export const succesIconForeground = registerColor(
  'kt.successIconForeground',
  { dark: '#DBA936', light: '#73D13D', hcDark: iconForeground, hcLight: iconForeground },
  localize('successIconForeground', 'Foreground color for success icon'),
);

export const successBackground = registerColor(
  'kt.successBackground',
  { dark: '#D7951340', light: '#95DE6440', hcDark: null, hcLight: null },
  localize('successBackground', 'Background color for success text'),
);

export const infoIconForeground = registerColor(
  'kt.infoIconForeground',
  {
    dark: editorInfoForeground,
    light: editorInfoForeground,
    hcDark: editorInfoForeground,
    hcLight: editorInfoForeground,
  },
  localize('infoIconForeground', 'Foreground color for info icon'),
);

export const infoBackground = registerColor(
  'kt.infoBackground',
  { dark: '#167CDB40', light: '#6EB6FA40', hcDark: null, hcLight: null },
  localize('infoBackground', 'Background color for info text'),
);

export const hintIconForeground = registerColor(
  'kt.hintIconForeground',
  { dark: '#868C91', light: '#999999', hcDark: iconForeground, hcLight: iconForeground },
  localize('hintIconForeground', 'Foreground color for hint icon'),
);

export const hintBackground = registerColor(
  'kt.hintBackground',
  { dark: '#5F656B40', light: '#CCCCCC40', hcDark: null, hcLight: null },
  localize('hintBackground', 'Background color for hint text'),
);
