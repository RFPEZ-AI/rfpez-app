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
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Response status: ${proxyRes.statusCode}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy] Error:', err.message);
        res.status(502).json({ error: 'Proxy error', message: err.message });
      }
    })
  );
};
