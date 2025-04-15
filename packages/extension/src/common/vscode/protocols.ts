import { ProxyIdentifier } from '@Nuvio-MCP/ide-connection';
import { ExtensionDocumentProtocol } from '@Nuvio-MCP/ide-connection/lib/common/protocols/extensions/ext-host-documents';
import { TSumiProtocol } from '@Nuvio-MCP/ide-connection/lib/common/rpc';

import { ExtHostAPIIdentifier } from '.';

export const knownProtocols = new Map<ProxyIdentifier<any>, TSumiProtocol>();

knownProtocols.set(ExtHostAPIIdentifier.ExtHostDocuments, ExtensionDocumentProtocol);
