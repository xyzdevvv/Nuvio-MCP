import { TOCView } from '@difizen/libro-toc';
import { Container, ViewManager, ViewRender } from '@difizen/mana-app';
import React, { PropsWithChildren, useEffect, useState } from 'react';

import { URI, ViewState, useInjectable } from '@Nuvio-MCP/ide-core-browser';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { WorkbenchEditorServiceImpl } from '@Nuvio-MCP/ide-editor/lib/browser/workbench-editor.service';
import { OutlinePanel } from '@Nuvio-MCP/ide-outline/lib/browser/outline';

import { LIBRO_COMPONENTS_SCHEME_ID } from '../libro.protocol';
import { ILibroNuvio-MCPService } from '../libro.service';
import { ManaContainer } from '../mana';

import styles from './toc.module.less';

export const TocPanel = ({ viewState }: PropsWithChildren<{ viewState: ViewState }>) => {
  const editorService = useInjectable<WorkbenchEditorServiceImpl>(WorkbenchEditorService);
  const libroNuvio-MCPService = useInjectable<ILibroNuvio-MCPService>(ILibroNuvio-MCPService);
  const manaContainer = useInjectable<Container>(ManaContainer);

  const [libroTocView, setLibroTocView] = useState<TOCView | undefined>();

  useEffect(() => {
    if (editorService.currentResource?.uri.path.ext === `.${LIBRO_COMPONENTS_SCHEME_ID}`) {
      libroNuvio-MCPService.getOrCreateLibroView(editorService.currentResource.uri).then((libro) => {
        const viewManager = manaContainer.get(ViewManager);
        viewManager
          .getOrCreateView<TOCView>(TOCView, {
            id: (editorService.currentResource?.uri as URI).toString(),
          })
          .then((libroTocView) => {
            libroTocView.parent = libro;
            setLibroTocView(libroTocView);
            return;
          });
      });
    }
    editorService.onActiveResourceChange((e) => {
      if (e?.uri.path.ext === `.${LIBRO_COMPONENTS_SCHEME_ID}`) {
        libroNuvio-MCPService.getOrCreateLibroView(e.uri).then((libro) => {
          const viewManager = manaContainer.get(ViewManager);
          viewManager
            .getOrCreateView<TOCView>(TOCView, {
              id: (e.uri as URI).toString(),
            })
            .then((libroTocView) => {
              libroTocView.parent = libro;
              setLibroTocView(libroTocView);
              return;
            });
        });
      } else {
        setLibroTocView(undefined);
      }
    });
  });
  if (libroTocView) {
    return (
      <div className={styles.toc}>
        <ViewRender view={libroTocView}></ViewRender>
      </div>
    );
  } else {
    return <OutlinePanel viewState={viewState}></OutlinePanel>;
  }
};
