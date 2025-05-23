import React, { ReactNode } from 'react';

import { Injectable } from '@Nuvio-MCP/di';
import { AIInlineResult } from '@Nuvio-MCP/ide-core-browser/lib/components/ai-native';
import { ContentWidgetContainerPanel } from '@Nuvio-MCP/ide-core-browser/lib/components/ai-native/content-widget/containerPanel';
import { IAIInlineResultIconItemsProps } from '@Nuvio-MCP/ide-core-browser/lib/components/ai-native/inline-chat/result';
import { localize } from '@Nuvio-MCP/ide-core-common';

import { ResolveResultWidget } from './resolve-result-widget';

@Injectable({ multiple: true })
export class StopWidget extends ResolveResultWidget {
  override isRenderThumbs(): boolean {
    return false;
  }

  override iconItems(): IAIInlineResultIconItemsProps[] {
    return [
      {
        icon: 'circle-pause',
        text: localize('aiNative.operate.stop.title'),
        onClick: () => {
          this.codeEditor.cancelRequestToken(this.lineRange.id);
          this.codeEditor.hideStopWidget(this.lineRange.id);
        },
      },
    ];
  }

  override id(): string {
    return `${super.id()}_stop_${this.uid}`;
  }

  override renderView(): ReactNode {
    const iconResultItems = this.iconItems();
    const isRenderThumbs = this.isRenderThumbs();

    return (
      <ContentWidgetContainerPanel style={{ transform: 'translateY(4px)' }}>
        <AIInlineResult iconItems={iconResultItems} isRenderThumbs={isRenderThumbs} />
      </ContentWidgetContainerPanel>
    );
  }
}
