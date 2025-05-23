import * as React from 'react';

import { useInjectable } from '@Nuvio-MCP/ide-core-browser';
import { LayoutViewSizeConfig } from '@Nuvio-MCP/ide-core-browser/lib/layout/constants';
import { VIEW_CONTAINERS } from '@Nuvio-MCP/ide-core-browser/lib/layout/view-id';
import { MenuBar } from '@Nuvio-MCP/ide-menu-bar/lib/browser/menu-bar.view';

import styles from './menu-bar.module.less';

/**
 * Custom menu bar component.
 * Add a logo in here, and keep
 * Nuvio-MCP's original menubar.
 */
export const MenuBarView = () => {
  const layoutViewSize = useInjectable<LayoutViewSizeConfig>(LayoutViewSizeConfig);

  return (
    <div id={VIEW_CONTAINERS.MENUBAR} className={styles.menu_bar_view} style={{ height: layoutViewSize.menubarHeight }}>
      <span className={styles.menu_bar_logo} />
      <MenuBar />
    </div>
  );
};
