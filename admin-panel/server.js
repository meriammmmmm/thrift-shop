const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3005;

// Enable JSON parsing (50mb limit for base64 images in Image Chat / AI routes)
app.use(express.json({ limit: '50mb' }));

// CORS headers for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: process.env.BACKEND_URL || 'http://localhost:5001',
  changeOrigin: true,
  timeout: 60000, // 60 seconds timeout for large image uploads
  proxyTimeout: 60000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Backend connection failed', details: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to backend`);
    // Set content length for large payloads
    if (req.body && req.method === 'POST') {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    }
  }
}));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  console.log(`🎨 React Admin Panel running on port ${PORT}`);
  console.log(`📊 Backend API: ${backendUrl}/api`);
  console.log(`🔄 Proxy enabled: Admin panel requests will be forwarded to backend`);
});