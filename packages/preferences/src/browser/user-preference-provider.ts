import { Injectable } from '@Nuvio-MCP/di';
import { Schemes, URI } from '@Nuvio-MCP/ide-core-browser';
import { PreferenceScope } from '@Nuvio-MCP/ide-core-browser/lib/preferences';

import { AbstractResourcePreferenceProvider } from './abstract-resource-preference-provider';

export const USER_PREFERENCE_URI = new URI().withScheme(Schemes.userStorage).withPath('settings.json');

@Injectable()
export class UserPreferenceProvider extends AbstractResourcePreferenceProvider {
  protected getUri(): URI {
    return USER_PREFERENCE_URI;
  }

  protected getScope() {
    return PreferenceScope.User;
  }
}
