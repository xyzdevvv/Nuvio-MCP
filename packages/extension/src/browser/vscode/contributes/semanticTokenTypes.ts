import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { ILogger } from '@Nuvio-MCP/ide-core-browser/lib/logger';
import { LifeCyclePhase } from '@Nuvio-MCP/ide-core-common';
import { ISemanticTokenRegistry } from '@Nuvio-MCP/ide-theme/lib/common/semantic-tokens-registry';

import {
  Contributes,
  LifeCycle,
  SemanticTokenTypeSchema,
  VSCodeContributePoint,
  validateTypeOrModifier,
} from '../../../common';

@Injectable()
@Contributes('semanticTokenTypes')
@LifeCycle(LifeCyclePhase.Ready)
export class SemanticTokenTypesContributionPoint extends VSCodeContributePoint<SemanticTokenTypeSchema> {
  @Autowired(ILogger)
  protected readonly logger: ILogger;

  @Autowired(ISemanticTokenRegistry)
  protected readonly semanticTokenRegistry: ISemanticTokenRegistry;

  contribute() {
    for (const contrib of this.contributesMap) {
      const { contributes } = contrib;
      if (!Array.isArray(contributes)) {
        this.logger.warn("'configuration.semanticTokenTypes' must be an array");
        return;
      }

      for (const contrib of contributes) {
        if (validateTypeOrModifier(contrib, 'semanticTokenType', this.logger)) {
          this.semanticTokenRegistry.registerTokenType(contrib.id, contrib.description, contrib.superType);
        }
      }
    }
  }
}
