#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const required = [
  'docs/product/PRD.md',
  'docs/product/USER_STORIES.md',
  'docs/product/ACCEPTANCE_CRITERIA.md',
  'docs/engineering/PAAL_WORKFLOW.md'
];

for (const rel of required) {
  const abs = path.join(rootDir, rel);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required docs file: ${rel}`);
    process.exit(1);
  }
}

const prd = fs.readFileSync(path.join(rootDir, 'docs/product/PRD.md'), 'utf8');
if (!/JTBD/i.test(prd) && !/I want to/i.test(prd)) {
  console.error('PRD.md must include JTBD framing.');
  process.exit(1);
}

console.log('Docs checks passed.');
