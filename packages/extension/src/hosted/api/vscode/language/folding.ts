import { Uri as URI } from '@Nuvio-MCP/ide-core-common';

import { ExtensionDocumentDataManager } from '../../../../common/vscode';
import * as Converter from '../../../../common/vscode/converter';
import { FoldingContext, FoldingRange } from '../../../../common/vscode/model.api';

import type vscode from 'vscode';

export class FoldingProviderAdapter {
  constructor(private documents: ExtensionDocumentDataManager, private provider: vscode.FoldingRangeProvider) {}

  async provideFoldingRanges(
    resource: URI,
    context: FoldingContext,
    token: vscode.CancellationToken,
  ): Promise<FoldingRange[] | undefined> {
    const documentData = this.documents.getDocumentData(resource);
    if (!documentData) {
      return Promise.reject(new Error(`There is no document for ${resource}`));
    }
    const doc = documentData.document;
    const ranges = await this.provider.provideFoldingRanges(doc, context, token);
    if (!Array.isArray(ranges)) {
      return undefined;
    }
    return ranges.map(Converter.fromFoldingRange);
  }
}
