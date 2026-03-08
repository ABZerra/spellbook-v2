#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function parseCsv(content) {
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

function toList(value) {
  return String(value || '')
    .split(/[,;|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapRow(row, index) {
  const name = String(row.Name || '').trim();
  const level = Number(row['Spell Level'] || 0);
  const source = toList(row.Source);
  const spellList = toList(row['Spell List']);
  const id = slugify([name, level || 0, source[0] || 'source'].join('-')) || `spell-${index + 1}`;

  return {
    id,
    name,
    level: Number.isFinite(level) ? Math.max(0, Math.trunc(level)) : 0,
    source,
    spellList,
    save: String(row.Save || '').trim(),
    castingTime: String(row['Casting Time'] || '').trim(),
    notes: String(row.Notes || '').trim(),
    description: String(row.Description || '').trim(),
    school: String(row.School || '').trim(),
    duration: String(row.Duration || '').trim(),
    range: String(row.Range || '').trim(),
    components: String(row.Components || row.Component || '').trim(),
    tags: toList(row.Tags)
  };
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: npm run snapshot:import -- <path/to/Spells.csv>');
    process.exit(1);
  }

  const repoRoot = path.resolve(new URL('..', import.meta.url).pathname, '..');
  const csvAbs = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(csvAbs)) {
    console.error(`CSV not found: ${csvAbs}`);
    process.exit(1);
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
    schemaVersion: 1,
    sourceFile: path.basename(csvAbs),
    generatedAt: new Date().toISOString(),
    spells
  };

  writeJson(path.join(repoRoot, 'data', 'spells.snapshot.json'), snapshot);
  writeJson(path.join(repoRoot, 'apps', 'web', 'public', 'spells.snapshot.json'), snapshot);

  console.log(`Imported ${spells.length} spells from ${path.basename(csvAbs)}.`);
}

main();
