import { Injectable } from '@Nuvio-MCP/di';

@Injectable()
export class MockFileSearch {
  async find(pattern: string, options) {
    return [''];
  }
}
