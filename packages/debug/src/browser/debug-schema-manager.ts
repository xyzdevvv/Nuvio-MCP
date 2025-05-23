import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IJSONSchema, IJSONSchemaRegistry, objects } from '@Nuvio-MCP/ide-core-browser';

import { launchExtensionSchemaUri, launchSchemaUri } from '../common';
import { DebugServer, IDebugServer } from '../common/debug-service';

import { DebugConfigurationManager } from './debug-configuration-manager';

const { deepClone } = objects;

@Injectable()
export class DebugSchemaManager {
  @Autowired(IDebugServer)
  protected readonly debug: DebugServer;

  @Autowired(IJSONSchemaRegistry)
  private schemaRegistry: IJSONSchemaRegistry;

  @Autowired(DebugConfigurationManager)
  private config: DebugConfigurationManager;

  public async update(): Promise<void> {
    const debuggers = this.config.getDebuggers();
    const schema = { ...deepClone(launchSchema) };
    const items = schema!.properties!.configurations.items as IJSONSchema;
    const configurations = debuggers.map((dbg) => ({
      attributes: Object.keys(dbg.configurationAttributes || {}).map((request) => {
        const attributes: IJSONSchema = dbg.configurationAttributes[request];
        return attributes;
      }),
      configurationSnippets: dbg.configurationSnippets,
    }));
    for (const { attributes, configurationSnippets } of configurations) {
      if (attributes && items.oneOf) {
        items.oneOf!.push(...attributes);
      }
      if (configurationSnippets && items.defaultSnippets) {
        items.defaultSnippets.push(...configurationSnippets);
      }
    }

    this.schemaRegistry.registerSchema(launchExtensionSchemaUri, schema, ['launch.json']);
  }
}

export const launchSchema: IJSONSchema = {
  $id: launchSchemaUri,
  type: 'object',
  title: 'Launch',
  required: [],
  default: { version: '0.2.0', configurations: [] },
  properties: {
    version: {
      type: 'string',
      description: 'Version of this file format.',
      default: '0.2.0',
    },
    configurations: {
      type: 'array',
      description: 'List of configurations. Add new configurations or edit existing ones by using IntelliSense.',
      items: {
        defaultSnippets: [],
        type: 'object',
        oneOf: [],
      },
    },
  },
};
