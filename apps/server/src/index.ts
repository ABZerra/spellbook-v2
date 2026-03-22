import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { loadConfig } from './config.js';
import { GitHubClient } from './github.js';
import { createApiRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = loadConfig();

const github = new GitHubClient({
  pat: config.githubPat,
  repo: config.githubRepo,
  branch: config.githubBranch,
});

const app = express();

app.use(express.json());

// API routes
app.use('/api', createApiRouter(github));

// Static files (built frontend)
const staticPath = path.resolve(__dirname, config.staticDir);
app.use(express.static(staticPath));

// SPA fallback — serve index.html for all non-API, non-static routes
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Spellbook server running on port ${config.port}`);
});
