#!/usr/bin/env node

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
