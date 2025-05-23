import { CancellationToken, Event, IDisposable } from '@Nuvio-MCP/ide-core-browser';

import { ObservableValue } from './observableValue';
import { ITestResult } from './test-result';
import {
  InternalTestItem,
  MainThreadTestCollection,
  ResolvedTestRunRequest,
  RunTestForControllerRequest,
  TestRunProfileBitset,
  TestsDiff,
} from './testCollection';

export * from './testId';

export interface ITestController {
  readonly id: string;
  readonly label: string;
  readonly canRefresh: ObservableValue<boolean>;
  configureRunProfile(profileId: number): void;
  expandTest(testId: string, levels: number): Promise<void>;
  refreshTests(token: CancellationToken): Promise<void>;
  runTests(request: RunTestForControllerRequest, token: CancellationToken): Promise<void>;
}

export const TestServiceToken = Symbol('TestService');
export const TestDecorationsToken = Symbol('TestDecorationsToken');
export const TestPeekMessageToken = Symbol('TestPeekMessageToken');

export interface ITestingPeekMessageService {
  onDidReveal: Event<any>;
}

export interface ITestService {
  readonly collection: MainThreadTestCollection;

  registerTestController(id: string, testController: ITestController): IDisposable;
  runTests(req: AmbiguousRunTestsRequest, token?: CancellationToken): Promise<ITestResult>;
  publishDiff(controllerId: string, diff: TestsDiff): void;
  runResolvedTests(req: ResolvedTestRunRequest, token?: CancellationToken): Promise<ITestResult>;
  onDidProcessDiff: Event<TestsDiff>;
  getTestController(controllerId: string): ITestController | undefined;
  refreshTests(controllerId?: string): Promise<void>;
}

export interface AmbiguousRunTestsRequest {
  /** Group to run */
  group: TestRunProfileBitset;
  /** Tests to run. Allowed to be from different controllers */
  tests: readonly InternalTestItem[];
  /** Tests to exclude. If not given, the current UI excluded tests are used */
  exclude?: InternalTestItem[];
  /** Whether this was triggered from an auto run. */
  isAutoRun?: boolean;
}
