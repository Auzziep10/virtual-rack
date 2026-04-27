const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force Metro to resolve ONLY the local React version to prevent the useMemo null error
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' || moduleName.startsWith('react/') ||
    moduleName === 'react-dom' || moduleName.startsWith('react-dom/') ||
    moduleName === 'react-native' || moduleName.startsWith('react-native/')
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, 'index.js') },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
