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
  '@expo/vector-icons': path.resolve(
    monorepoRoot,
    'node_modules/@expo/vector-icons'
  ),
  'react-native-reanimated': path.resolve(
    projectRoot,
    'node_modules/react-native-reanimated'
  ),
  'react-native-worklets': path.resolve(
    monorepoRoot,
    'node_modules/react-native-worklets'
  ),
  'expo-glass-effect': path.resolve(
    projectRoot,
    'node_modules/expo-router/node_modules/expo-glass-effect'
  ),
  'ansi-regex': path.resolve(
    monorepoRoot,
    'node_modules/ansi-regex'
  ),
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
