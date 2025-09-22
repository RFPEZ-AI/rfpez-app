#!/usr/bin/env node

// Monkey patch the webpack-dev-server to handle deprecated options
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  const module = originalRequire.apply(this, arguments);
  
  // Patch webpack-dev-server configuration schema
  if (id === 'webpack-dev-server' && module.schema) {
    // Add deprecated properties back to schema to prevent errors
    if (module.schema.properties && !module.schema.properties.onAfterSetupMiddleware) {
      module.schema.properties.onAfterSetupMiddleware = { type: 'function' };
      module.schema.properties.onBeforeSetupMiddleware = { type: 'function' };
    }
  }
  
  return module;
};

// Suppress specific webpack dev server deprecation warnings
const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data.name === 'DeprecationWarning' &&
    (data.message.includes('onAfterSetupMiddleware') ||
     data.message.includes('onBeforeSetupMiddleware'))
  ) {
    return false;
  }
  return originalEmit.apply(process, arguments);
};

// Start the regular react-scripts start
require('react-scripts/scripts/start');
