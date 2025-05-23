import { INormalizedDocumentSymbol } from '@Nuvio-MCP/ide-editor/lib/browser/breadcrumb/document-symbol';

import { OutlineCompositeTreeNode, OutlineRoot, OutlineTreeNode } from '../../src/browser/outline-node.define';
import { OutlineTreeService } from '../../src/browser/services/outline-tree.service';

describe('OutlineCompositeTreeNode', () => {
  let rootNode: OutlineRoot;
  let node: OutlineCompositeTreeNode;

  const mockOutlineTreeService = {
    resolveChildren: jest.fn((parent?: any) => {
      if (!parent.raw) {
        return [new OutlineCompositeTreeNode(mockOutlineTreeService, rootNode, mockRaw, '')];
      }
    }) as any,
  } as OutlineTreeService;

  const mockRaw = {
    children: [],
    name: 'test',
    id: 'id',
    detail: '',
    // kind: SymbolKind.Boolean,
    kind: 16,
    range: {
      startColumn: 0,
      endColumn: 10,
      startLineNumber: 2,
      endLineNumber: 2,
    },
    selectionRange: {
      startColumn: 0,
      endColumn: 10,
      startLineNumber: 2,
      endLineNumber: 2,
    },
  } as unknown as INormalizedDocumentSymbol;

  beforeAll(() => {
    rootNode = new OutlineRoot(mockOutlineTreeService, null);
    node = new OutlineCompositeTreeNode(mockOutlineTreeService, rootNode, mockRaw, '');
  });

  it('should have correct property', () => {
    expect(node.parent).toEqual(rootNode);
    expect(node.expanded).toBeTruthy();
    expect(node.displayName).toBe(mockRaw.name);
    expect(node.expanded).toBeTruthy();
  });
});

describe('OutlineTreeNode', () => {
  let rootNode: OutlineRoot;
  let node: OutlineTreeNode;

  const mockOutlineTreeService = {
    resolveChildren: jest.fn(() => [
      new OutlineCompositeTreeNode(mockOutlineTreeService, rootNode, mockRaw, ''),
    ]) as any,
  } as OutlineTreeService;

  const mockRaw = {
    children: [],
    name: 'test',
    id: 'id',
    detail: '',
    // kind: SymbolKind.Boolean,
    kind: 16,
    range: {
      startColumn: 0,
      endColumn: 10,
      startLineNumber: 2,
      endLineNumber: 2,
    },
    selectionRange: {
      startColumn: 0,
      endColumn: 10,
      startLineNumber: 2,
      endLineNumber: 2,
    },
  } as unknown as INormalizedDocumentSymbol;

  beforeAll(() => {
    rootNode = new OutlineRoot(mockOutlineTreeService, null);
    node = new OutlineTreeNode(mockOutlineTreeService, rootNode, mockRaw, '');
  });

  it('should have correct property', () => {
    expect(node.parent).toEqual(rootNode);
    expect(node.displayName).toBe(mockRaw.name);
  });
});
