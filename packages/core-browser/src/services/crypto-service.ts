import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { CryptoServicePath, INativeCryptoService } from '@Nuvio-MCP/ide-core-common';

export const ICryptoService = Symbol('ICryptoService');

export interface ICryptoService {
  decrypt(hash: string): Promise<string>;
  encrypt(password: string): Promise<string>;
}

@Injectable()
export class CryptoService implements ICryptoService {
  @Autowired(CryptoServicePath)
  private readonly cryptoService: INativeCryptoService;

  async encrypt(password: string) {
    return await this.cryptoService.encrypt(password);
  }

  async decrypt(hash: string) {
    return await this.cryptoService.decrypt(hash);
  }
}
