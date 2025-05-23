import { localize } from '@Nuvio-MCP/ide-core-common';

import { registerColor } from '../../utils';
import { foreground } from '../base';
import { TAB_BORDER } from '../tab';

export const ktEditorBreadcrumbBorderDown = registerColor(
  'kt.editorBreadcrumb.borderDown',
  {
    dark: '#2C3033',
    light: '#F2F2F2',
    hcDark: TAB_BORDER,
    hcLight: TAB_BORDER,
  },
  localize('kt.editorBreadcrumb.borderDown', "editor Breadcrumb's bottom border color."),
);

export const ktDirtyDotForeground = registerColor(
  'kt.dirtyDot.foreground',
  {
    dark: '#868C91',
    light: '#999999',
    hcDark: foreground,
    hcLight: foreground,
  },
  localize('kt.dirtyDot.foreground', 'color for dirty mark.'),
);
