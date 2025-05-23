import { Emitter, sleep } from '@Nuvio-MCP/ide-core-browser';
import { CancellationToken, CancellationTokenSource, Deferred, Disposable } from '@Nuvio-MCP/ide-core-common';
import { IDebugSessionManager } from '@Nuvio-MCP/ide-debug';
import { DebugSessionConnection } from '@Nuvio-MCP/ide-debug/lib/browser/debug-session-connection';
import { DebugProtocol } from '@Nuvio-MCP/vscode-debugprotocol';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../tools/dev-tool/src/mock-injector';

describe('DebugSessionConnection', () => {
  let debugSessionConnection: DebugSessionConnection;
  let injector: MockInjector;

  const cancellationRequestMap: Map<number, CancellationTokenSource[]> = new Map();
  const cancelationTokensMap = new Map<number, boolean>();

  const getNewCancellationToken = (threadId: number, token?: CancellationToken): CancellationToken => {
    const tokenSource = new CancellationTokenSource(token);
    const tokens = cancellationRequestMap.get(threadId) || [];
    tokens.push(tokenSource);
    cancellationRequestMap.set(threadId, tokens);
    return tokenSource.token;
  };

  const mockDebugSessionManager = {
    reportTime: jest.fn(() => jest.fn()),
    getSession: jest.fn((sessionId: string | undefined) => ({
      capabilities: {
        supportsCancelRequest: true,
      },
      id: sessionId,
      onDidChange: jest.fn(() => Disposable.create(() => {})),
      on: jest.fn(),
      start: jest.fn(() => new Promise(() => {})),
      onDidCustomEvent: jest.fn(),
      configuration: {
        type: 'node',
      },
      state: {},
      sendRequest: jest.fn((command: string, args: any) => {
        if (command === 'cancel') {
          cancelationTokensMap.set(args.requestId, true);
        }
      }),
      dispose: jest.fn(),
    })),
  };

  const messageEmitter: Emitter<string> = new Emitter();

  const mockConnection = {
    onceClose: jest.fn(),
    onMessage: messageEmitter.event,
    send: jest.fn((request) => {
      const requestData = JSON.parse(request);
      // 立即返回值
      messageEmitter.fire(
        JSON.stringify({
          type: 'response',
          request_seq: requestData.seq,
          body: {
            hello: 'world',
          },
          success: true,
        }),
      );
    }),
  };

  const connectionFactory = (sessionId: string) => mockConnection as any;

  const traceOutputChannel = {
    appendLine: jest.fn(),
  } as any;

  beforeAll(() => {
    injector = createBrowserInjector(
      [],
      new MockInjector([
        {
          token: IDebugSessionManager,
          useValue: mockDebugSessionManager,
        },
      ]),
    );
    debugSessionConnection = injector.get(DebugSessionConnection, ['1001', connectionFactory, traceOutputChannel]);
  });

  afterAll(async () => {
    await injector.disposeAll();
  });

  it('first, create connection', () => {
    expect(mockConnection.onceClose).toHaveBeenCalledTimes(1);
  });

  it('send initialize command', async () => {
    await debugSessionConnection.sendRequest(
      'initialize',
      { clientID: 'sumi', adapterID: 'node' },
      {
        type: 'node',
        name: 'test',
        request: 'node-debug',
      },
    );
    expect(mockConnection.send).toHaveBeenCalledTimes(1);
    mockConnection.send.mockClear();
  });

  it('send continue command', async () => {
    expect.assertions(2);
    const defered = new Deferred();

    debugSessionConnection.on('continued', (event) => {
      expect(event.event).toBe('continued');
      defered.resolve();
    });
    await debugSessionConnection.sendRequest(
      'continue',
      { threadId: 1000001 },
      {
        type: 'node',
        name: 'test',
        request: 'node-debug',
      },
    );
    expect(mockConnection.send).toHaveBeenCalledTimes(1);
    mockConnection.send.mockClear();
    await defered.promise;
  });

  it('send custom request', async () => {
    await debugSessionConnection.sendCustomRequest('abc', {});
    expect(mockConnection.send).toHaveBeenCalledTimes(1);
  });

  it('handle request message', (done) => {
    debugSessionConnection.onRequest('abc', () => {
      done();
    });
    messageEmitter.fire(
      JSON.stringify({
        type: 'request',
        command: 'abc',
        seq: '1000002',
      }),
    );
  });

  it('handle response message', async () => {
    const requestPromise = debugSessionConnection.sendCustomRequest('bcd', {
      seq: '999',
    });
    messageEmitter.fire(
      JSON.stringify({
        type: 'response',
        request_seq: '999',
        body: {
          hello: 'world',
        },
      }),
    );
    expect(await requestPromise).toBeDefined();
  });

  it('handle event message', (done) => {
    debugSessionConnection.on('exited', () => {
      done();
    });
    messageEmitter.fire(
      JSON.stringify({
        type: 'event',
      }),
    );
  });

  it(
    'handle cancel request',
    async () => {
      const threadId = 10086;
      const delayDebugSessionConnection = injector.get(DebugSessionConnection, [
        '10010',
        async (sessionId: string) =>
          ({
            onceClose: jest.fn(),
            onMessage: messageEmitter.event,
            sessionId: 10010,
            send: jest.fn(async (request: string) => {
              const requestJson: DebugProtocol.Request = JSON.parse(request);
              for (let i = 0; i < 30; i++) {
                await sleep(100);
                if (requestJson && cancelationTokensMap.get(requestJson.seq)) {
                  messageEmitter.fire(
                    JSON.stringify({
                      type: 'response',
                      request_seq: requestJson.seq,
                      body: {
                        threads: ['TQL'],
                      },
                      success: true,
                    }),
                  );
                  return;
                }
              }
              messageEmitter.fire(
                JSON.stringify({
                  type: 'response',
                  request_seq: requestJson.seq,
                  body: {
                    threads: ['TQL', 'TQL', 'TQL', 'TQL', 'TQL'],
                  },
                  success: true,
                }),
              );
            }),
          } as any),
        traceOutputChannel,
      ]);

      const requestToken = getNewCancellationToken(threadId);

      delayDebugSessionConnection
        .sendRequest(
          'threads',
          {},
          {
            type: 'node',
            name: 'test',
            request: 'node-debug',
          },
          requestToken,
        )
        .then((result) => {
          const {
            body: { threads },
          } = result as DebugProtocol.ThreadsResponse;
          expect(threads.length).toBe(1);
        });

      await sleep(500);

      cancellationRequestMap.forEach((c) => c.forEach((t) => t.cancel()));
      cancellationRequestMap.clear();
    },
    20 * 1000,
  );
});
