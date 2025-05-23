import { localize } from '@Nuvio-MCP/ide-core-common';

import { Color } from '../../common/color';
import { registerColor } from '../utils';

import { contrastBorder } from './base';

export const progressBarBackground = registerColor(
  'progressBar.background',
  { dark: Color.fromHex('#0E70C0'), light: Color.fromHex('#0E70C0'), hcDark: contrastBorder, hcLight: contrastBorder },
  localize('progressBarBackground', 'Background color of the progress bar that can show for long running operations.'),
);
