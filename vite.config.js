import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only: run the serverless handlers in api/ inside the Vite dev server, so
// `npm run dev` serves the Notion proxy with no Vercel CLI needed. In
// production Vercel runs the same api/ files as real serverless functions.
function devApiPlugin() {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        const path = req.url.split('?')[0];

        // Minimal Vercel-style response helpers.
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
          return res;
        };

        try {
          if (path === '/api/cups') {
            const mod = await server.ssrLoadModule('/api/cups.js');
            await mod.default(req, res);
          } else {
            res.status(404).json({ error: `No dev route for ${path}` });
          }
        } catch (err) {
          server.config.logger.error(`[dev-api] ${err.stack || err}`);
          if (!res.writableEnded) res.status(500).json({ error: String(err.message || err) });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load every env var (not just VITE_*) and expose the server-only ones to
  // the dev API handlers via process.env.
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['NOTION_TOKEN', 'NOTION_DATABASE_ID']) {
    if (env[key]) process.env[key] = env[key];
  }

  return {
    plugins: [react(), devApiPlugin()],
  };
});
