import { asClassNameArrayWrapper } from '@Nuvio-MCP/ide-core-browser';
import { ThemeIcon } from '@Nuvio-MCP/ide-core-common';
import { Sumicon } from '@Nuvio-MCP/ide-core-common/lib/codicons';
import { LightBulbWidget } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/contrib/codeAction/browser/lightBulbWidget';

// @ts-ignore
export class SumiLightBulbWidget extends LightBulbWidget {
  protected override _updateLightBulbTitleAndIcon(): void {
    super['_updateLightBulbTitleAndIcon']();

    const state = super['state'];
    if (state.type !== 1 /* LightBulbState.Type.Showing */) {
      return;
    }

    let icon: ThemeIcon | undefined = super['icon'];

    if (state.actions.allAIFixes || (state.actions.hasAutoFix && state.actions.hasAIFix) || state.actions.hasAIFix) {
      icon = Sumicon.magicWand;
    }

    if (icon) {
      this.getDomNode().classList.remove(...this['_iconClasses']);
      this.getDomNode().classList.add(...asClassNameArrayWrapper(icon));
    }
  }
}
