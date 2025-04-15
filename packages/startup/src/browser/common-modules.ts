import { ClientAddonModule } from '@Nuvio-MCP/ide-addons/lib/browser';
import { AINativeModule } from '@Nuvio-MCP/ide-ai-native/lib/browser';
import { CommentsModule } from '@Nuvio-MCP/ide-comments/lib/browser';
import { BrowserModule, ClientCommonModule, ConstructorOf } from '@Nuvio-MCP/ide-core-browser';
import { DebugModule } from '@Nuvio-MCP/ide-debug/lib/browser';
import { DecorationModule } from '@Nuvio-MCP/ide-decoration/lib/browser';
import { DesignModule } from '@Nuvio-MCP/ide-design/lib/browser';
import { EditorModule } from '@Nuvio-MCP/ide-editor/lib/browser';
import { ExplorerModule } from '@Nuvio-MCP/ide-explorer/lib/browser';
import { ExtensionModule } from '@Nuvio-MCP/ide-extension/lib/browser';
import { OpenVsxExtensionManagerModule } from '@Nuvio-MCP/ide-extension-manager/lib/browser';
import { ExtensionStorageModule } from '@Nuvio-MCP/ide-extension-storage/lib/browser';
import { FileSchemeModule } from '@Nuvio-MCP/ide-file-scheme/lib/browser';
import { FileServiceClientModule } from '@Nuvio-MCP/ide-file-service/lib/browser';
import { FileTreeNextModule } from '@Nuvio-MCP/ide-file-tree-next/lib/browser';
import { KeymapsModule } from '@Nuvio-MCP/ide-keymaps/lib/browser';
import { LogModule } from '@Nuvio-MCP/ide-logs/lib/browser';
import { MainLayoutModule } from '@Nuvio-MCP/ide-main-layout/lib/browser';
import { MarkdownModule } from '@Nuvio-MCP/ide-markdown';
import { MarkersModule } from '@Nuvio-MCP/ide-markers/lib/browser';
import { MenuBarModule } from '@Nuvio-MCP/ide-menu-bar/lib/browser';
import { MonacoModule } from '@Nuvio-MCP/ide-monaco/lib/browser';
import { MonacoEnhanceModule } from '@Nuvio-MCP/ide-monaco-enhance/lib/browser/module';
import { OpenedEditorModule } from '@Nuvio-MCP/ide-opened-editor/lib/browser';
import { OutlineModule } from '@Nuvio-MCP/ide-outline/lib/browser';
import { OutputModule } from '@Nuvio-MCP/ide-output/lib/browser';
import { OverlayModule } from '@Nuvio-MCP/ide-overlay/lib/browser';
import { PreferencesModule } from '@Nuvio-MCP/ide-preferences/lib/browser';
import { QuickOpenModule } from '@Nuvio-MCP/ide-quick-open/lib/browser';
import { SCMModule } from '@Nuvio-MCP/ide-scm/lib/browser';
import { SearchModule } from '@Nuvio-MCP/ide-search/lib/browser';
import { StatusBarModule } from '@Nuvio-MCP/ide-status-bar/lib/browser';
import { StorageModule } from '@Nuvio-MCP/ide-storage/lib/browser';
import { TaskModule } from '@Nuvio-MCP/ide-task/lib/browser';
import { TerminalNextModule } from '@Nuvio-MCP/ide-terminal-next/lib/browser';
import { TestingModule } from '@Nuvio-MCP/ide-testing/lib/browser';
import { ThemeModule } from '@Nuvio-MCP/ide-theme/lib/browser';
import { ToolbarModule } from '@Nuvio-MCP/ide-toolbar/lib/browser';
import { VariableModule } from '@Nuvio-MCP/ide-variable/lib/browser';
import { WebviewModule } from '@Nuvio-MCP/ide-webview';
import { WorkspaceModule } from '@Nuvio-MCP/ide-workspace/lib/browser';
import { WorkspaceEditModule } from '@Nuvio-MCP/ide-workspace-edit/lib/browser';

export const CommonBrowserModules: ConstructorOf<BrowserModule>[] = [
  MainLayoutModule,
  OverlayModule,
  LogModule,
  ClientCommonModule,
  MenuBarModule,
  MonacoModule,
  StatusBarModule,
  EditorModule,
  ExplorerModule,
  FileTreeNextModule,
  FileServiceClientModule,
  SearchModule,
  FileSchemeModule,
  OutputModule,
  QuickOpenModule,
  MarkersModule,

  ThemeModule,
  WorkspaceModule,
  ExtensionStorageModule,
  StorageModule,
  OpenedEditorModule,
  OutlineModule,
  PreferencesModule,
  ToolbarModule,
  WebviewModule,
  MarkdownModule,
  WorkspaceEditModule,
  SCMModule,
  DecorationModule,
  DebugModule,
  VariableModule,
  KeymapsModule,
  TerminalNextModule,

  // Extension Modules
  ExtensionModule,
  OpenVsxExtensionManagerModule,
  MonacoEnhanceModule,

  // addons
  ClientAddonModule,
  CommentsModule,
  TaskModule,
  TestingModule,
];

export const AIModules: ConstructorOf<BrowserModule>[] = [DesignModule, AINativeModule];
