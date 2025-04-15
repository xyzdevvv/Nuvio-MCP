import { CommentsModule } from '@Nuvio-MCP/ide-comments/lib/browser';
import { BrowserModule, ClientCommonModule } from '@Nuvio-MCP/ide-core-browser';
import { ConstructorOf } from '@Nuvio-MCP/ide-core-common';
import { DecorationModule } from '@Nuvio-MCP/ide-decoration/lib/browser';
import { EditorModule } from '@Nuvio-MCP/ide-editor/lib/browser';
import { ExplorerModule } from '@Nuvio-MCP/ide-explorer/lib/browser';
import { ExtensionModule } from '@Nuvio-MCP/ide-extension/lib/browser';
import { ExtensionStorageModule } from '@Nuvio-MCP/ide-extension-storage/lib/browser';
import { FileServiceClientModule } from '@Nuvio-MCP/ide-file-service/lib/browser';
import { FileTreeNextModule } from '@Nuvio-MCP/ide-file-tree-next/lib/browser';
import { KeymapsModule } from '@Nuvio-MCP/ide-keymaps/lib/browser';
import { LogModule } from '@Nuvio-MCP/ide-logs/lib/browser';
import { MainLayoutModule } from '@Nuvio-MCP/ide-main-layout/lib/browser';
import { MenuBarModule } from '@Nuvio-MCP/ide-menu-bar/lib/browser';
import { MonacoModule } from '@Nuvio-MCP/ide-monaco/lib/browser';
import { OpenedEditorModule } from '@Nuvio-MCP/ide-opened-editor/lib/browser';
import { OutlineModule } from '@Nuvio-MCP/ide-outline/lib/browser';
import { OutputModule } from '@Nuvio-MCP/ide-output/lib/browser';
import { OverlayModule } from '@Nuvio-MCP/ide-overlay/lib/browser';
import { PreferencesModule } from '@Nuvio-MCP/ide-preferences/lib/browser';
import { QuickOpenModule } from '@Nuvio-MCP/ide-quick-open/lib/browser';
import { StatusBarModule } from '@Nuvio-MCP/ide-status-bar/lib/browser';
import { StorageModule } from '@Nuvio-MCP/ide-storage/lib/browser';
import { ThemeModule } from '@Nuvio-MCP/ide-theme/lib/browser';
import { WebviewModule } from '@Nuvio-MCP/ide-webview/lib/browser';
import { WorkspaceModule } from '@Nuvio-MCP/ide-workspace/lib/browser';
import { WorkspaceEditModule } from '@Nuvio-MCP/ide-workspace-edit/lib/browser';

import { BrowserFileSchemeModule } from './lite-module/overrides/browser-file-scheme';

export const CommonBrowserModules: ConstructorOf<BrowserModule>[] = [
  FileServiceClientModule,
  MainLayoutModule,
  OverlayModule,
  LogModule,
  ClientCommonModule,
  StatusBarModule,
  MenuBarModule,
  MonacoModule,
  ExplorerModule,
  EditorModule,
  QuickOpenModule,
  KeymapsModule,
  FileTreeNextModule,
  ThemeModule,
  WorkspaceModule,
  ExtensionStorageModule,
  StorageModule,
  PreferencesModule,
  OpenedEditorModule,
  DecorationModule,
  WorkspaceEditModule,
  CommentsModule,
  WebviewModule,
  OutputModule,
  BrowserFileSchemeModule,
  OutlineModule,
  ExtensionModule,
];
