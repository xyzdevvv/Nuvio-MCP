import React from 'react';

import { useInjectable } from '@Nuvio-MCP/ide-core-browser';
import { AILogoAvatar } from '@Nuvio-MCP/ide-core-browser/lib/components/ai-native';
import { IMainLayoutService } from '@Nuvio-MCP/ide-main-layout';

import { AI_CHAT_VIEW_ID } from '../../../../common';

import styles from './avatar.module.less';

export const AIChatLogoAvatar = () => {
  const layoutService = useInjectable<IMainLayoutService>(IMainLayoutService);

  const handleChatVisible = React.useCallback(() => {
    layoutService.toggleSlot(AI_CHAT_VIEW_ID);
  }, [layoutService]);

  return (
    <div className={styles.ai_switch} onClick={handleChatVisible}>
      <AILogoAvatar iconClassName={styles.avatar_icon_large} />
    </div>
  );
};
