import { LOCALE_TYPES } from '@Nuvio-MCP/ide-core-common/lib/const';

import { IPreferences } from '../src';
import {
  PreferenceScope,
  getExternalPreference,
  getExternalPreferenceProvider,
  getPreferenceIconThemeId,
  getPreferenceLanguageId,
  getPreferenceThemeId,
  registerExternalPreferenceProvider,
  registerLocalStorageProvider,
} from '../src/preferences';

describe('external preference tests', () => {
  it('should be able to register preference provider and work properly', () => {
    const store: {
      [key: string]: any;
    } = {
      [PreferenceScope.Default]: undefined,
      [PreferenceScope.User]: undefined,
      [PreferenceScope.Workspace]: undefined,
      [PreferenceScope.Folder]: undefined,
    };

    registerExternalPreferenceProvider('test.preference', {
      get: (scope: PreferenceScope) => store[scope],
      set: (value, scope: PreferenceScope) => {
        store[scope] = value;
      },
    });
    const schema = { default: 'defaultSchemaTest' };

    expect(getExternalPreference('test.preference', schema).value).toBe('defaultSchemaTest');

    const provider = getExternalPreferenceProvider('test.preference')!;

    provider.set('Workspace', PreferenceScope.Workspace);
    expect(getExternalPreference('test.preference', schema).value).toBe('Workspace');
    expect(getExternalPreference('test.preference', schema).scope).toBe(PreferenceScope.Workspace);

    store[PreferenceScope.Folder] = 'Folder';
    expect(getExternalPreference('test.preference', schema).value).toBe('Folder');
    expect(getExternalPreference('test.preference', schema).scope).toBe(PreferenceScope.Folder);
    provider.set('DefaultTest', PreferenceScope.Default);
    expect(getExternalPreference('test.preference', schema).value).toBe('Folder');
    expect(getExternalPreference('test.preference', schema).scope).toBe(PreferenceScope.Folder);
    provider.set(undefined, PreferenceScope.Folder);
    provider.set(undefined, PreferenceScope.Workspace);
    expect(getExternalPreference('test.preference', schema).value).toBe('DefaultTest');
    expect(getExternalPreference('test.preference', schema).scope).toBe(PreferenceScope.Default);
  });

  it('default external preferences should work', () => {
    (global as any).localStorage = undefined;
    // should not throw error when localStorage is not defined;
    const mockWorkspace = '/User/test';
    // 注册 LocalStorageProvider
    registerLocalStorageProvider('general.theme', mockWorkspace);
    registerLocalStorageProvider('general.icon', mockWorkspace);
    registerLocalStorageProvider('general.language');

    getExternalPreferenceProvider('general.theme')?.set('test-theme', PreferenceScope.Workspace);
    expect(getPreferenceThemeId()).toBe('test-theme');

    // mock localStorage
    const store = new Map();
    (global as any).localStorage = {
      setItem: (key: string, value) => {
        store.set(key, value);
      },
      getItem: (key: string) => store.get(key),
    };
    const unique_languageId = 'zh-Hans';

    // 默认值为 zh-CN
    expect(getPreferenceLanguageId()).toBe('zh-CN');
    // 工作空间级别不生效
    getExternalPreferenceProvider('general.language')?.set(unique_languageId, PreferenceScope.Workspace);
    expect(getPreferenceLanguageId()).toBe('zh-CN');
    // 全局级别可生效
    getExternalPreferenceProvider('general.language')?.set(unique_languageId, PreferenceScope.Default);
    expect(getPreferenceLanguageId()).toBe(unique_languageId);

    // 传入默认配置的情况下，如果可以通过 `getExternalPreference` 获取配置值，优先级为： Folder > Workspace > User > 传入值 > Default,
    expect(
      getPreferenceLanguageId({
        'general.language': LOCALE_TYPES.EN_US,
      } as IPreferences),
    ).toBe(LOCALE_TYPES.EN_US);

    // 采用 getExternalPreference 中的值兜底
    expect(
      getPreferenceLanguageId({
        'general.theme': 'vscode-icon',
      } as IPreferences),
    ).toBe(unique_languageId);

    getExternalPreferenceProvider('general.icon')?.set('test-icon', PreferenceScope.Workspace);
    expect(getPreferenceIconThemeId()).toBe('test-icon');
  });
});
