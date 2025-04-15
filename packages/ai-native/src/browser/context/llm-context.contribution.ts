import { Autowired } from '@Nuvio-MCP/di';
import { ClientAppContribution, Domain } from '@Nuvio-MCP/ide-core-browser';

import { LLMContextService, LLMContextServiceToken } from '../../common/llm-context';

@Domain(ClientAppContribution)
export class LlmContextContribution implements ClientAppContribution {
  @Autowired(LLMContextServiceToken)
  protected readonly llmContextService: LLMContextService;

  initialize() {
    this.llmContextService.startAutoCollection();
  }
}
