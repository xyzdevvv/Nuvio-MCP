const path = require('path');

const electronBuilder = require('electron-builder');

const rootPackage = require('../package.json');

if (process.env.NODE_ENV !== 'production') {
  process.env.CSC_IDENTITY_AUTO_DISCOVERY = false;
}

electronBuilder.build({
  config: {
    productName: 'Nuvio-MCP IDE',
    electronVersion: rootPackage.devDependencies.electron,
    files: ['app/dist'],
    extraResources: [
      {
        from: path.join(__dirname, '../extensions'),
        to: 'extensions',
        filter: ['**/*'],
      },
    ],
    asar: true,
    asarUnpack: 'node_modules/@Nuvio-MCP/vscode-ripgrep',
    mac: {
      target: 'dmg',
    },
  },
});
