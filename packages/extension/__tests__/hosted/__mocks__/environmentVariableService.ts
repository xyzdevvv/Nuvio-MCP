import { Disposable } from '@Nuvio-MCP/ide-core-common';

export const MockEnvironmentVariableService = {
  set: () => {},
  delete: () => {},
  mergedCollection: undefined,
  onDidChangeCollections: () => Disposable.NULL,
};
