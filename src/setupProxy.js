/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
// Copyright Mark Skiba, 2025 All rights reserved
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /api/* requests to the API server on port 3001
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq) => {
        console.log(`[Proxy] ${proxyReq.method} ${proxyReq.path} -> http://localhost:3001${proxyReq.path}`);
      },
      onProxyRes: (proxyRes) => {
        console.log(`[Proxy] Response status: ${proxyRes.statusCode}`);
      },
      onError: (err, _req, res) => {
        console.error('[Proxy] Error:', err.message);
        res.status(502).json({ error: 'Proxy error', message: err.message });
      }
    })
  );
};

