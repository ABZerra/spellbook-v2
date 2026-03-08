#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'apps', 'web');
const webDistDir = path.join(webDir, 'dist');
const pagesDistDir = path.join(rootDir, 'dist');

execSync('npm ci --prefix apps/web', { cwd: rootDir, stdio: 'inherit' });
execSync('npm run build --prefix apps/web', { cwd: rootDir, stdio: 'inherit' });

if (!existsSync(webDistDir)) {
  throw new Error('Missing apps/web/dist after build.');
}

rmSync(pagesDistDir, { recursive: true, force: true });
mkdirSync(pagesDistDir, { recursive: true });

cpSync(webDistDir, pagesDistDir, { recursive: true });
cpSync(path.join(rootDir, 'data', 'spells.snapshot.json'), path.join(pagesDistDir, 'spells.snapshot.json'));

if (existsSync(path.join(pagesDistDir, 'index.html'))) {
  cpSync(path.join(pagesDistDir, 'index.html'), path.join(pagesDistDir, '404.html'));
}

console.log(`Built GitHub Pages artifact at ${pagesDistDir}`);
