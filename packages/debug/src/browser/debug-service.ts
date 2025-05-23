import { Injectable } from '@Nuvio-MCP/di';
import { Emitter, Event, IJSONSchema } from '@Nuvio-MCP/ide-core-browser';

import { IDebugService, IDebugServiceContributionPoint } from '../common';

@Injectable()
export class DebugService implements IDebugService {
  private onDidDebugContributionPointChangeEmitter: Emitter<IDebugServiceContributionPoint> =
    new Emitter<IDebugServiceContributionPoint>();

  private debugContributionPointsMap: Map<string, IJSONSchema[]> = new Map();

  registerDebugContributionPoints(path: string, contributions: IJSONSchema[]) {
    if (!this.debugContributionPointsMap.has(path)) {
      this.debugContributionPointsMap.set(path, contributions);
      this.onDidDebugContributionPointChangeEmitter.fire({
        path,
        contributions,
      });
    }
  }

  unregisterDebugContributionPoints(path: string) {
    const contributions = this.debugContributionPointsMap.get(path);
    if (contributions) {
      this.debugContributionPointsMap.delete(path);
      this.onDidDebugContributionPointChangeEmitter.fire({
        path,
        contributions,
        removed: true,
      });
    }
  }

  get debugContributionPoints() {
    return this.debugContributionPointsMap;
  }

  get onDidDebugContributionPointChange(): Event<IDebugServiceContributionPoint> {
    return this.onDidDebugContributionPointChangeEmitter.event;
  }
}
