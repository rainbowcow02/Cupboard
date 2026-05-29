const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const config = getDefaultConfig(__dirname);

// Watch the shared folder so Metro picks up changes there
config.watchFolders = [workspaceRoot];

module.exports = config;
