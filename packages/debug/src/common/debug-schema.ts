import { CodeSchemaId } from '@Nuvio-MCP/ide-core-common';

export const launchSchemaUri = CodeSchemaId.launch;
export const launchExtensionSchemaUri = `${CodeSchemaId.launch}/extension`;
export const launchDefaultSchemaUri = `${CodeSchemaId.launch}/user`;

export enum JSON_SCHEMA_TYPE {
  ARRAY = 'array',
  BOOLEAN = 'boolean',
  NULL = 'null',
  NUMBER = 'number',
  OBJECT = 'object',
  STRING = 'string',
}
