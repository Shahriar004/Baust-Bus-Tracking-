import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const ROOT_DIR = process.cwd();

const PROJECT_FILES_LIST = [
  'app.py',
  'requirements.txt',
  'README.md',
  'data/__init__.py',
  'data/routes.py',
  'models/__init__.py',
  'models/bus_stop.py',
  'models/bus.py',
  'models/bus_route.py',
  'models/bus_schedule.py',
  'models/route_types.py',
  'services/__init__.py',
  'services/tracking_system.py',
  'templates/base.html',
  'templates/index.html',
  'templates/routes.html',
  'templates/route_detail.html',
  'templates/schedule.html',
  'templates/about.html',
  'templates/contact.html',
  'templates/404.html',
  'static/css/style.css',
  'static/js/script.js',
  'tests/test_system.py',
];

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json());

  // Serve static CSS and JS directly from /static
  app.use('/static', express.static(path.join(ROOT_DIR, 'static')));

  // Execute the real Python OOP BusTrackingSystem (services/tracking_system.py + data/routes.py)
  app.get('/api/bus-system', (_req, res) => {
    execFile(
      'python3',
      ['-m', 'services.tracking_system'],
      { cwd: ROOT_DIR, timeout: 5000 },
      (error, stdout) => {
        if (error) {
          res.status(500).json({ error: 'Python OOP execution failed', details: error.message });
          return;
        }
        try {
          const parsed = JSON.parse(stdout);
          res.json(parsed);
        } catch (parseErr) {
          res.status(500).json({ error: 'Invalid JSON from Python OOP system' });
        }
      }
    );
  });

  // Return Python/Flask/OOP project files for academic inspection / VS Code copy
  app.get('/api/project-files', (_req, res) => {
    const files: Record<string, string> = {};
    for (const relPath of PROJECT_FILES_LIST) {
      const fullPath = path.join(ROOT_DIR, relPath);
      if (fs.existsSync(fullPath)) {
        files[relPath] = fs.readFileSync(fullPath, 'utf-8');
      }
    }
    res.json({ files });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      plugins: [
        {
          name: 'disable-vite-client-ws-in-preview',
          transform(code, id) {
            if (id.includes('vite/dist/client/client.mjs')) {
              return code
                .replace(
                  'transport.connect(createHMRHandler(handleMessage));',
                  '/* WebSocket HMR disabled in preview */'
                )
                .replace('console.debug("[vite] connecting...");', '');
            }
          },
        },
      ],
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Baust Bus Tracking System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
