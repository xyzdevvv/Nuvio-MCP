import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { ClientAppContribution, Domain } from '@Nuvio-MCP/ide-core-browser';
import { FileTreeDropEvent, OnEvent, WithEventBus } from '@Nuvio-MCP/ide-core-common';

import { IFileDropFrontendService, IFileDropFrontendServiceToken } from '../common';

@Injectable()
@Domain(ClientAppContribution)
export class FileDropContribution extends WithEventBus {
  @Autowired(IFileDropFrontendServiceToken)
  protected readonly dropService: IFileDropFrontendService;

  @OnEvent(FileTreeDropEvent)
  onDidDropFile(e: FileTreeDropEvent) {
    this.dropService.onDidDropFile(e);
  }
}
