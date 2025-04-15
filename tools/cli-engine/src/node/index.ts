import fs from 'fs';
import path from 'path';

import mri from 'mri';

import { modules } from './modules';
import { startServer } from './server';

const argv = mri(process.argv.slice(2));

const { serverPort, workspaceDir, extensionCandidate, isDev, extHostPath, watchServerPort } = argv;

let serverAppOpts = {
  modules,
};

let clientAppOpts = {};

/**
 * sumi-dev.config.js 用于在插件开发时自定义一些 Nuvio-MCP client 及 server 端的默认配置
 * 当传入多个 extensionDir 时，优先取第一个插件目录下的 sumi-dev.config.js
 */
const extensions = strToArray(extensionCandidate);

const Nuvio-MCPDevConfigPath = path.resolve(extensions[0], 'sumi-dev.config.js');
// read `sumi-dev.config.js`
if (fs.existsSync(Nuvio-MCPDevConfigPath)) {
  const Nuvio-MCPDevConfig = require(Nuvio-MCPDevConfigPath);
  serverAppOpts = {
    ...serverAppOpts,
    ...Nuvio-MCPDevConfig.serverAppOpts,
  };
  clientAppOpts = { ...Nuvio-MCPDevConfig.clientAppOpts };
}

startServer(
  {
    port: Number(serverPort as string),
    isDev: !!isDev,
    workspaceDir: workspaceDir as string,
    extensionCandidate: extensionCandidate ? strToArray(extensionCandidate as string | string[]) : undefined,
    extHostPath: extHostPath as string,
    watchServerPort,
  },
  {
    serverAppOpts,
    clientAppOpts,
  },
);

function strToArray(item: string | string[]): string[] {
  return Array.isArray(item) ? item : [item];
}
