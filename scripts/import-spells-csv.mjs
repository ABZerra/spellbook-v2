#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseCsv(content) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (ch === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    if (ch !== '\r') {
      value += ch;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

export function toList(value) {
  return String(value || '')
    .split(/[,;|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function mapRow(row, index) {
  const name = String(row.Name || '').trim();
  const level = Number(row.Level || row['Spell Level'] || 0);
  const id = String(row['Spell ID'] || '').trim() || slugify([name, level || 0, row.Source || 'source'].join('-')) || `spell-${index + 1}`;
  const ddbSpellId = String(row['DDB Spell ID'] || '').trim();

  return {
    id,
    ddbSpellId,
    name,
    level: Number.isFinite(level) ? Math.max(0, Math.trunc(level)) : 0,
    source: String(row.Source || '').trim(),
    page: String(row.Page || '').trim(),
    sourceCitation: String(row['Source Citation'] || '').trim(),
    save: String(row.Save || '').trim(),
    castingTime: String(row['Casting Time'] || '').trim(),
    notes: String(row.Notes || '').trim(),
    description: String(row.Description || '').trim(),
    school: String(row.School || '').trim(),
    duration: String(row.Duration || '').trim(),
    rangeArea: String(row['Range/Area'] || row.Range || '').trim(),
    attackSave: String(row['Attack/Save'] || '').trim(),
    damageEffect: String(row['Damage/Effect'] || '').trim(),
    atHigherLevels: String(row['At Higher Levels'] || row['Higher Level'] || '').trim(),
    components: String(row.Components || row.Component || '').trim(),
    componentsExpanded: String(row['Components [expanded]'] || row.Components || row.Component || '').trim(),
    spellTags: toList(row['Spell Tags'] || row.Tags),
    availableFor: toList(row['Available For']),
    ddbUrl: String(row['DDB URL'] || '').trim(),
  };
}

export function getRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export function importSnapshot(inputPath, cwd = process.cwd()) {
  if (!inputPath) {
    throw new Error('Usage: npm run snapshot:import -- <path/to/Spells.csv>');
  }

  const repoRoot = getRepoRoot();
  const csvAbs = path.resolve(cwd, inputPath);

  if (!fs.existsSync(csvAbs)) {
    throw new Error(`CSV not found: ${csvAbs}`);
  }

  const raw = fs.readFileSync(csvAbs, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(raw);
  if (rows.length < 2) {
    console.error('CSV has no data rows.');
    process.exit(1);
  }

  const [header, ...dataRows] = rows;
  const objects = dataRows
    .filter((row) => row.some((cell) => String(cell || '').trim()))
    .map((row) => {
      const obj = {};
      for (let i = 0; i < header.length; i += 1) obj[header[i]] = row[i] ?? '';
      return obj;
    });

  const spells = objects
    .map((row, index) => mapRow(row, index))
    .filter((spell) => spell.id && spell.name)
    .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));

  const snapshot = {
    schemaVersion: 2,
    sourceFile: path.basename(csvAbs),
    generatedAt: new Date().toISOString(),
    spells
  };

  writeJson(path.join(repoRoot, 'data', 'spells.snapshot.json'), snapshot);
  writeJson(path.join(repoRoot, 'apps', 'web', 'public', 'spells.snapshot.json'), snapshot);

  return {
    csvAbs,
    snapshot,
  };
}

function main() {
  try {
    const inputPath = process.argv[2];
    const { snapshot } = importSnapshot(inputPath);
    console.log(`Imported ${snapshot.spells.length} spells from ${snapshot.sourceFile}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unable to import snapshot.');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
