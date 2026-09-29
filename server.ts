import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/api.ts';
import { initDatabase } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API
app.use('/api', apiRouter);

// Static assets from Vite build
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Initialize DB and start server
initDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`[SIH26186] Personnel Stress Monitoring Server running on port ${PORT}`);
  });
});
