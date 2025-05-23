import { Command, getExternalIcon, getIcon } from '@Nuvio-MCP/ide-core-browser';

export const RuntTestCommand: Command = {
  id: 'testing.run.test',
  label: 'Run Test',
};

export const DebugTestCommand: Command = {
  id: 'testing.debug.test',
  label: 'Debug Test',
};

export const GoToTestCommand: Command = {
  id: 'testing.goto.test',
  label: 'Go To Test',
};

export const TestingRunCurrentFile: Command = {
  id: 'testing.runCurrentFile',
  label: 'Run Tests in Current File',
};

export const TestingDebugCurrentFile: Command = {
  id: 'testing.debugCurrentFile',
  label: 'Debug Tests in Current File',
};

export const PeekTestError: Command = {
  id: 'testing.peek.test.error',
  label: 'Peek Output',
};

export const ClosePeekTest: Command = {
  id: 'testing.peek.test.close',
  label: 'Close Peek Output',
};

export const GoToPreviousMessage: Command = {
  id: 'testing.goToPreviousMessage',
  label: 'Go to Previous Test Failure',
  iconClass: getIcon('arrowup'),
};

export const GoToNextMessage: Command = {
  id: 'testing.goToNextMessage',
  label: 'Go to Next Test Failure',
  iconClass: getIcon('arrowdown'),
};

export const ClearTestResults: Command = {
  id: 'testing.clearTestResults',
  label: 'Clear All Results',
  iconClass: getExternalIcon('clear-all'),
};

export const OpenMessageInEditor: Command = {
  id: 'testing.openMessageInEditor',
  label: 'Open in Editor',
  iconClass: getExternalIcon('link-external'),
};

export const RuntAllTestCommand: Command = {
  id: 'testing.runAll',
  label: 'Run All Test',
  iconClass: getExternalIcon('run-all'),
};

export const DebugAllTestCommand: Command = {
  id: 'testing.debugAll',
  label: 'Debug All Test',
  iconClass: getIcon('debug-alt-small'),
};

export const RefreshTestsCommand: Command = {
  id: 'testing.refresshTests',
  label: 'Refresh Tests',
  iconClass: getIcon('refresh'),
};
