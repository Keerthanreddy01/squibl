const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (packages, root node_modules, etc.)
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve packages from both mobile and monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Fallback explicit mappings for hoisted packages
config.resolver.extraNodeModules = {
  '@react-native-async-storage/async-storage': path.resolve(
    monorepoRoot,
    'node_modules/@react-native-async-storage/async-storage'
  ),
  '@supabase/supabase-js': path.resolve(
    monorepoRoot,
    'node_modules/@supabase/supabase-js'
  ),
};

module.exports = config;
