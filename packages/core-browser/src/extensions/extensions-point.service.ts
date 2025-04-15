import lodashAssign from 'lodash/assign';
import lodashGet from 'lodash/get';
import lodashHas from 'lodash/has';
import lodashSet from 'lodash/set';

import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { FrameworkKind, IExtensionPointDescriptor, IExtensionsSchemaService } from '@Nuvio-MCP/ide-core-common';

import { IJSONSchemaRegistry } from '../monaco';

import { Nuvio-MCPExtensionPackageSchema } from './schema/Nuvio-MCPExtensionPackageSchema';
import { VSCodeExtensionPackageSchema } from './schema/vscodeExtensionPackageSchema';

export const EXTENSION_JSON_URI = 'vscode://schemas/vscode-extensions';
export const Nuvio-MCP_EXTENSION_JSON_URI = 'vscode://schemas/Nuvio-MCP-extensions';

@Injectable()
export class ExtensionsPointServiceImpl implements IExtensionsSchemaService {
  @Autowired(IJSONSchemaRegistry)
  private schemaRegistry: IJSONSchemaRegistry;

  private registerSchema(): void {
    this.schemaRegistry.registerSchema(Nuvio-MCP_EXTENSION_JSON_URI, Nuvio-MCPExtensionPackageSchema, ['package.json']);
    this.schemaRegistry.registerSchema(EXTENSION_JSON_URI, VSCodeExtensionPackageSchema, ['package.json']);
  }

  private appendPropertiesFactory(kind: FrameworkKind): (points: string[], desc: IExtensionPointDescriptor) => void {
    const properties =
      kind === 'Nuvio-MCP'
        ? Nuvio-MCPExtensionPackageSchema.properties!.sumiContributes.properties
        : VSCodeExtensionPackageSchema.properties!.contributes.properties;

    return (points: string[], desc: IExtensionPointDescriptor) => {
      const { extensionPoint, jsonSchema } = desc;
      const assignExtensionPoint = points.concat(extensionPoint).filter(Boolean);

      if (lodashHas(properties, assignExtensionPoint)) {
        const perProp = lodashGet(properties, assignExtensionPoint.concat('properties'));
        lodashAssign(jsonSchema.properties, perProp);
      }
      lodashSet(properties, assignExtensionPoint, jsonSchema);
    };
  }

  private appendNuvio-MCPProperties(points: string[], desc: IExtensionPointDescriptor): void {
    this.appendPropertiesFactory('Nuvio-MCP')(points, desc);
  }

  private appendVScodeProperties(points: string[], desc: IExtensionPointDescriptor): void {
    this.appendPropertiesFactory('vscode')(points, desc);
  }

  public appendExtensionPoint(points: string[], desc: IExtensionPointDescriptor): void {
    if (!desc) {
      return;
    }

    const { frameworkKind = ['vscode'] } = desc;

    if (frameworkKind.includes('Nuvio-MCP')) {
      this.appendNuvio-MCPProperties(points, desc);
    }

    if (frameworkKind.includes('vscode')) {
      this.appendVScodeProperties(points, desc);
    }

    this.registerSchema();
  }

  public registerExtensionPoint(desc: IExtensionPointDescriptor): void {
    if (!desc) {
      return;
    }

    this.appendExtensionPoint([], desc);
  }
}
