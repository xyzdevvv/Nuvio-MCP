import { DocumentCommands, LibroView } from '@difizen/libro-jupyter/noeditor';
import { CommandRegistry, Container, Disposable, ViewRender } from '@difizen/mana-app';
import * as React from 'react';

import { message } from '@Nuvio-MCP/ide-components';
import { localize, useInjectable } from '@Nuvio-MCP/ide-core-browser';
import { ReactEditorComponent } from '@Nuvio-MCP/ide-editor/lib/browser/types';

import styles from './libro.module.less';
import { ILibroNuvio-MCPService } from './libro.service';
import { ManaContainer } from './mana';

const AUTO_SAVE_DELAY = 1000; // ms

export const Nuvio-MCPLibroView: ReactEditorComponent = (...params) => {
  const libroNuvio-MCPService = useInjectable<ILibroNuvio-MCPService>(ILibroNuvio-MCPService);
  const manaContainer = useInjectable<Container>(ManaContainer);
  const commandRegistry = manaContainer.get(CommandRegistry);

  const [libroView, setLibroView] = React.useState<LibroView | undefined>(undefined);

  React.useEffect(() => {
    let autoSaveHandle: undefined | number;
    let modelChangeDisposer: undefined | Disposable;
    libroNuvio-MCPService.getOrCreateLibroView(params[0].resource.uri).then((libro) => {
      setLibroView(libro);
      modelChangeDisposer = libro.model.onChanged(() => {
        libroNuvio-MCPService.updateDirtyStatus(params[0].resource.uri, true);
        if (autoSaveHandle) {
          window.clearTimeout(autoSaveHandle);
        }
        autoSaveHandle = window.setTimeout(() => {
          commandRegistry
            .executeCommand(DocumentCommands.Save.id, undefined, libro, undefined, { reason: 'autoSave' })
            .then(() => {
              if (libro) {
                libro.model.dirty = false;
              }
            })
            .catch((error) => {
              message.error(localize('doc.saveError.failed'), error);
            });
        }, AUTO_SAVE_DELAY);
      });
      libro.onSave(() => {
        libroNuvio-MCPService.updateDirtyStatus(params[0].resource.uri, false);
      });
    });
    return () => {
      modelChangeDisposer?.dispose();
      window.clearTimeout(autoSaveHandle);
    };
  }, []);

  return <div className={styles.libroView}>{libroView && <ViewRender view={libroView}></ViewRender>}</div>;
};
