import { IDisposable } from '@Nuvio-MCP/ide-core-common';

export interface IExtHostTheming {
  $onColorThemeChange(themeType: string): void;
}

export type IMainThreadTheming = IDisposable;
