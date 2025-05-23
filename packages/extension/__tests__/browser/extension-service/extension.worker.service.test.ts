import { URI } from '@Nuvio-MCP/ide-core-browser';
import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { WorkerExtProcessService } from '@Nuvio-MCP/ide-extension/lib/browser/extension-worker.service';

import { IExtensionWorkerHost, WorkerHostAPIIdentifier } from '../../../src/common';

import { MOCK_EXTENSIONS, setupExtensionServiceInjector } from './extension-service-mock-helper';

describe('Extension service', () => {
  jest.setTimeout(20 * 1000);

  let workerService: WorkerExtProcessService;
  let injector: MockInjector;

  beforeAll(async () => {
    injector = setupExtensionServiceInjector();
    workerService = injector.get(WorkerExtProcessService);
  });

  it('initExtension should be work', async () => {
    await workerService.updateExtensionData(MOCK_EXTENSIONS);
    expect(workerService.getExtension(MOCK_EXTENSIONS[0].id)).toBeDefined();
    expect(workerService.getExtension(MOCK_EXTENSIONS[0].id)?.id).toBe(MOCK_EXTENSIONS[0].id);
  });

  it('activate worker host should be work', async () => {
    await workerService.activate(true);
    expect(workerService.protocol).toBeDefined();
    const proxy = workerService.protocol.getProxy<IExtensionWorkerHost>(
      WorkerHostAPIIdentifier.ExtWorkerHostExtensionService,
    );
    expect(proxy).toBeDefined();
  });

  it('activate extension should be work', async () => {
    await workerService.activeExtension(MOCK_EXTENSIONS[0], true);
    const activated = await workerService.getActivatedExtensions.bind(workerService)();
    expect(activated.find((e) => e.id === MOCK_EXTENSIONS[0].id)).toBeTruthy();
  });

  it('should get correct worker script uri', async () => {
    let extensionPath = '/__mocks__/extension';
    const workerMain = './worker.js';
    const getWorkerURI = () => {
      let extUri = new URI(extensionPath);
      if (!extUri.scheme) {
        extUri = URI.file(extensionPath);
      }
      const fixedWorkerMain = workerMain.replace(/^\.\//, '');
      return extUri.resolve(fixedWorkerMain);
    };

    expect(getWorkerURI().toString()).toBe(`file://${extensionPath}/worker.js`);

    extensionPath = 'kt-ext://host/__mocks__/extension';
    expect(getWorkerURI().toString()).toBe(`${extensionPath}/worker.js`);
  });
});
