const { createWebpackConfig } = require('@Nuvio-MCP/ide-dev-tool/src/webpack');
module.exports = createWebpackConfig(__dirname, require('path').join(__dirname, 'entry/web/e2e/app.tsx'));
