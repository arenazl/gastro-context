const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Verificar que los archivos del frontend existen
const distPath = path.join(__dirname, 'frontend', 'dist');
console.log('Looking for frontend files in:', distPath);
if (fs.existsSync(distPath)) {
  console.log('Frontend dist folder exists');
  const files = fs.readdirSync(distPath);
  console.log('Files in dist:', files);
  
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    console.log('Files in assets:', assetFiles);
  }
} else {
  console.error('WARNING: Frontend dist folder does not exist!');
}

// Servir archivos estáticos del frontend
app.use(express.static(distPath));

// Proxy todas las rutas /api al backend Python
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:9002',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to backend`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Backend server is not available' });
  }
}));

// Servir imágenes estáticas
app.use('/static', express.static(path.join(__dirname, 'backend', 'static')));

// Todas las demás rutas sirven el index.html (para React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API Proxy: http://localhost:${PORT}/api`);
  
  // Iniciar backend Python en paralelo
  const { spawn } = require('child_process');
  const backend = spawn('python', ['backend/complete_server.py'], {
    env: { ...process.env, PORT: '9002' }
  });
  
  backend.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });
  
  backend.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });
  
  backend.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    process.exit(code);
  });
});