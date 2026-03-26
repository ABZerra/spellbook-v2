import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { loadConfig } from './config.js';
import { GitHubClient } from './github.js';
import { createApiRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting server... PORT env:', process.env.PORT);
const config = loadConfig();
console.log('Config loaded, port:', config.port);

const github = new GitHubClient({
  pat: config.githubPat,
  repo: config.githubRepo,
  branch: config.githubDataBranch,
});

const app = express();

app.use(express.json());

// Health check for keep-alive pings
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// API routes
app.use('/api', createApiRouter(github));

// Static files (built frontend)
const staticPath = path.resolve(process.cwd(), 'apps/web/dist');
console.log('__dirname:', __dirname);
console.log('cwd:', process.cwd());
console.log('Static path:', staticPath);
app.use(express.static(staticPath));

// SPA fallback — serve index.html for all non-API, non-static routes
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Spellbook server running on port ${config.port}`);
});
