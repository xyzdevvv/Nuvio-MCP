import { FileSystemProvider } from '@Nuvio-MCP/ide-core-browser';

export const IUserStorageService = Symbol('IUserStorageService');

export type IUserStorageService = FileSystemProvider;
