import { Injectable } from '@Nuvio-MCP/di';
import { VALIDATE_TYPE } from '@Nuvio-MCP/ide-core-browser/lib/components';
import { HideReason } from '@Nuvio-MCP/ide-core-browser/lib/quick-open';

import { QuickOpenModel, QuickOpenOptions, QuickOpenService } from '../';

@Injectable()
export class MockQuickOpenService implements QuickOpenService {
  refresh(): void {
    throw new Error('Method not implemented.');
  }

  open(model: QuickOpenModel, options?: QuickOpenOptions): void {
    throw new Error('Method not implemented.');
  }
  hide(reason?: HideReason): void {
    throw new Error('Method not implemented.');
  }
  showDecoration(type: VALIDATE_TYPE): void {
    throw new Error('Method not implemented.');
  }
  hideDecoration(): void {
    throw new Error('Method not implemented.');
  }
  updateOptions(options: QuickOpenOptions): void {
    throw new Error('Method not implemented.');
  }
}
