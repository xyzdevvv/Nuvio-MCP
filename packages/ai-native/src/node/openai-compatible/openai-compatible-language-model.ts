import { OpenAICompatibleProvider, createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LanguageModelV1 } from 'ai';

import { Injectable } from '@Nuvio-MCP/di';
import { AINativeSettingSectionsId, IAIBackServiceOption } from '@Nuvio-MCP/ide-core-common';

import { ModelInfo } from '../../common';
import { BaseLanguageModel } from '../base-language-model';

@Injectable()
export class OpenAICompatibleModel extends BaseLanguageModel {
  protected initializeProvider(options: IAIBackServiceOption): OpenAICompatibleProvider {
    const apiKey = options.apiKey;
    if (!apiKey) {
      throw new Error(`Please provide OpenAI API Key in preferences (${AINativeSettingSectionsId.OpenaiApiKey})`);
    }
    return createOpenAICompatible({
      apiKey,
      baseURL: options.baseURL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      name: 'openai',
    });
  }

  protected getModelIdentifier(provider: OpenAICompatibleProvider, modelId = 'qwen-max'): LanguageModelV1 {
    return provider(modelId);
  }

  protected getModelInfo(_modelId: string, _providerOptions?: Record<string, any>): ModelInfo | undefined {
    return undefined;
  }
}
