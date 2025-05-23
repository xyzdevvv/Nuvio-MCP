import { localize } from '@Nuvio-MCP/ide-core-common';

import { Color } from '../../common/color';
import { registerColor, transparent } from '../utils';

import { contrastBorder } from './base';

export const scrollbarShadow = registerColor(
  'scrollbar.shadow',
  { dark: '#000000', light: '#DDDDDD', hcDark: null, hcLight: null },
  localize('scrollbarShadow', 'Scrollbar shadow to indicate that the view is scrolled.'),
);
export const scrollbarSliderBackground = registerColor(
  'scrollbarSlider.background',
  {
    dark: Color.fromHex('#797979').transparent(0.4),
    light: Color.fromHex('#646464').transparent(0.4),
    hcDark: transparent(contrastBorder, 0.6),
    hcLight: transparent(contrastBorder, 0.4),
  },
  localize('scrollbarSliderBackground', 'Scrollbar slider background color.'),
);
export const scrollbarSliderHoverBackground = registerColor(
  'scrollbarSlider.hoverBackground',
  {
    dark: Color.fromHex('#646464').transparent(0.7),
    light: Color.fromHex('#646464').transparent(0.7),
    hcDark: transparent(contrastBorder, 0.8),
    hcLight: transparent(contrastBorder, 0.8),
  },
  localize('scrollbarSliderHoverBackground', 'Scrollbar slider background color when hovering.'),
);
export const scrollbarSliderActiveBackground = registerColor(
  'scrollbarSlider.activeBackground',
  {
    dark: Color.fromHex('#BFBFBF').transparent(0.4),
    light: Color.fromHex('#000000').transparent(0.6),
    hcDark: contrastBorder,
    hcLight: contrastBorder,
  },
  localize('scrollbarSliderActiveBackground', 'Scrollbar slider background color when clicked on.'),
);
