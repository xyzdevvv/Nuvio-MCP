import { localize } from '@Nuvio-MCP/ide-core-browser';
import { registerColor } from '@Nuvio-MCP/ide-theme/lib/common';

export const initTocPanelColorToken = () => {
  registerColor(
    'toc.panel.text.color',
    { dark: '#A6AAAD', light: '#363C42', hcDark: null, hcLight: null },
    localize('toc.panel.text.color', 'the text color of toc panel'),
    true,
  );
};
