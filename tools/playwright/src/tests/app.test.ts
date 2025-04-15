import path from 'path';

import { expect } from '@playwright/test';

import { Nuvio-MCPApp } from '../app';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

test.describe('Application', () => {
  test('should show main layout', async () => {
    const workspace = new Nuvio-MCPWorkspace([path.resolve('./src/tests/workspaces/default')]);
    const app = await Nuvio-MCPApp.load(page, workspace);
    expect(await app.isMainLayoutVisible()).toBe(true);
  });
});
