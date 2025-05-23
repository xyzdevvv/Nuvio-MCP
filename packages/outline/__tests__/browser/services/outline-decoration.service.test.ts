import { MarkerManager, MarkerSeverity, URI } from '@Nuvio-MCP/ide-core-common';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { IThemeService } from '@Nuvio-MCP/ide-theme';

import { createMockedMonaco } from '../../../../monaco/__mocks__/monaco';
import { OutlineCompositeTreeNode, OutlineRoot } from '../../../src/browser/outline-node.define';
import { OutlineDecorationService } from '../../../src/browser/services/outline-decoration.service';

describe('OutlineDecorationService', () => {
  let outlineDecorationService: OutlineDecorationService;
  const mockInjector = createBrowserInjector([]);

  const mockMarkerManager = {
    getMarkers: jest.fn(() => [
      {
        startLineNumber: 0,
        startColumn: 0,
        endLineNumber: 1,
        endColumn: 10,
        severity: MarkerSeverity.Error,
      },
    ]),
  };

  const mocThemeService = {
    getColor: jest.fn(),
  };

  const root = new OutlineRoot({ resolveChildren: () => [] } as any, null);

  beforeAll(() => {
    (global as any).monaco = createMockedMonaco() as any;

    mockInjector.overrideProviders({
      token: IThemeService,
      useValue: mocThemeService,
    });

    mockInjector.overrideProviders({
      token: MarkerManager,
      useValue: mockMarkerManager,
    });

    outlineDecorationService = mockInjector.get(OutlineDecorationService);
  });

  it('should have enough API', () => {
    expect(typeof outlineDecorationService.updateDiagnosisInfo).toBe('function');
    expect(typeof outlineDecorationService.getDecoration).toBe('function');
  });

  it('updateDiagnosisInfo method should be work', () => {
    outlineDecorationService.updateDiagnosisInfo(new URI('test.js'));
    expect(mockMarkerManager.getMarkers).toHaveBeenCalledTimes(1);
  });

  it('getDecoration method should be work', () => {
    const decorationNode = new OutlineCompositeTreeNode(
      {} as any,
      root as any,
      {
        name: 'test',
        kind: 0,
        range: {
          startLineNumber: 0,
          startColumn: 0,
          endLineNumber: 1,
          endColumn: 10,
        },
      } as any,
      '',
    );
    outlineDecorationService.getDecoration(decorationNode);
    expect(mocThemeService.getColor).toHaveBeenCalledTimes(1);
  });
});
