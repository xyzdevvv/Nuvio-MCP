import { Autowired } from '@Nuvio-MCP/di';
import { Domain } from '@Nuvio-MCP/ide-core-common/lib/di-helper';
import { IHashCalculateService } from '@Nuvio-MCP/ide-core-common/lib/hash-calculate/hash-calculate';

import { ClientAppContribution } from '../common/common.define';

@Domain(ClientAppContribution)
export class HashCalculateContribution implements ClientAppContribution {
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
