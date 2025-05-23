import { ReactNode } from 'react';

import { Injectable } from '@Nuvio-MCP/di';
import { WithEventBus } from '@Nuvio-MCP/ide-core-browser';

import { IEditorTabService } from './types';

@Injectable()
export class EditorTabService extends WithEventBus implements IEditorTabService {
  renderEditorTab(component: ReactNode, isCurrent: boolean): ReactNode {
    return component;
  }
  renderTabCloseComponent(component: ReactNode): ReactNode {
    return component;
  }
}
