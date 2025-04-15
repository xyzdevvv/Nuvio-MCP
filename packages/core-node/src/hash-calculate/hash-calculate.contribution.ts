import { Autowired } from '@Nuvio-MCP/di';
import { Domain } from '@Nuvio-MCP/ide-core-common/lib/di-helper';
import { IHashCalculateService } from '@Nuvio-MCP/ide-core-common/lib/hash-calculate/hash-calculate';

import { ServerAppContribution } from '../types';

@Domain(ServerAppContribution)
export class HashCalculateContribution implements ServerAppContribution {
  @Autowired(IHashCalculateService)
  private readonly hashCalculateService: IHashCalculateService;

  async initialize() {
    try {
      await this.hashCalculateService.initialize();
    } catch (err) {
      throw new Error(`hashCalculateService init fail: \n ${err.message}`);
    }
  }
}
