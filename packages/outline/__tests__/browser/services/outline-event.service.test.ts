import { EventBusImpl, IEventBus } from '@Nuvio-MCP/ide-core-common';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { EditorActiveResourceStateChangedEvent, EditorSelectionChangeEvent } from '@Nuvio-MCP/ide-editor/lib/browser';
import { DocumentSymbolChangedEvent } from '@Nuvio-MCP/ide-editor/lib/browser/breadcrumb/document-symbol';

import { OutlineEventService } from '../../../src/browser/services/outline-event.service';

describe('OutlineEventService', () => {
  let outlineEventService: OutlineEventService;
  let eventBus;
  const mockInjector = createBrowserInjector(
    [],
    new MockInjector([
      {
        token: IEventBus,
        useClass: EventBusImpl,
      },
    ]),
  );

  beforeAll(() => {
    outlineEventService = mockInjector.get(OutlineEventService);
    eventBus = mockInjector.get(IEventBus);
  });

  afterAll(() => {
    outlineEventService.dispose();
  });

  it('should have enough API', () => {
    expect(typeof outlineEventService.onDidChange).toBe('function');
    expect(typeof outlineEventService.onDidActiveChange).toBe('function');
    expect(typeof outlineEventService.onDidSelectionChange).toBe('function');
  });

  it('EditorActiveResourceStateChangedEvent event should be handle', (done) => {
    outlineEventService.onDidActiveChange(() => {
      done();
    });
    eventBus.fireAndAwait(new EditorActiveResourceStateChangedEvent({} as any));
  });

  it('EditorSelectionChangeEvent event should be handle', (done) => {
    outlineEventService.onDidSelectionChange(() => {
      done();
    });
    eventBus.fireAndAwait(new EditorSelectionChangeEvent({} as any));
  });

  it('DocumentSymbolChangedEvent event should be handle', (done) => {
    outlineEventService.onDidChange(() => {
      done();
    });
    eventBus.fireAndAwait(new DocumentSymbolChangedEvent({} as any));
  });
});
