const path = require('path');

const { createWebpackConfig } = require('@Nuvio-MCP/ide-dev-tool/src/webpack');

module.exports = createWebpackConfig(__dirname, path.join(__dirname, 'entry/web/app.tsx'), {});
