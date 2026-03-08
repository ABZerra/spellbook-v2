const ALLOWED_ISSUE_CODES = new Set([
  'AMBIGUOUS_LIST',
  'MISSING_SPELL',
  'MISSING_NAME',
  'LIST_MISMATCH',
]);

function asString(value) {
  return String(value ?? '').trim();
}

function normalizeWhitespace(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSpellNameForKey(name) {
  return normalizeWhitespace(name)
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '');
}

function normalizePreparedSpells(values) {
  const seen = new Set();
  const preparedSpells = [];

  for (const value of values) {
    const name = normalizeWhitespace(value);
    if (!name) continue;
    const key = normalizeSpellNameForKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    preparedSpells.push(name);
  }

  return preparedSpells;
}

function normalizeListName(list) {
  return normalizeWhitespace(list).toUpperCase();
}

function normalizeIssueEntry(entry, index) {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`issues[${index}] must be an object.`);
  }

  const code = asString(entry.code).toUpperCase();
  if (!ALLOWED_ISSUE_CODES.has(code)) {
    throw new Error(`issues[${index}].code is invalid.`);
  }

  const detail = normalizeWhitespace(entry.detail);
  if (!detail) {
    throw new Error(`issues[${index}].detail is required.`);
  }

  const operationIndex = Number(entry.operationIndex);
  if (!Number.isInteger(operationIndex) || operationIndex < 0) {
    throw new Error(`issues[${index}].operationIndex must be a non-negative integer.`);
  }

  return { code, detail, operationIndex };
}

function normalizeSpellOp(op, index) {
  if (!op || typeof op !== 'object') {
    throw new Error(`operations[${index}] must be an object.`);
  }

  const type = asString(op.type).toLowerCase();
  if (!['replace', 'prepare', 'unprepare'].includes(type)) {
    throw new Error(`operations[${index}].type must be replace, prepare, or unprepare.`);
  }

  const list = normalizeListName(op.list);
  if (!list) {
    throw new Error(`operations[${index}].list is required.`);
  }

  if (type === 'replace') {
    const remove = normalizeWhitespace(op.remove);
    const add = normalizeWhitespace(op.add);
    if (!remove) {
      throw new Error(`operations[${index}].remove is required for replace.`);
    }
    if (!add) {
      throw new Error(`operations[${index}].add is required for replace.`);
    }
    return { type, list, remove, add };
  }

  const spell = normalizeWhitespace(op.spell);
  if (!spell) {
    throw new Error(`operations[${index}].spell is required for ${type}.`);
  }

  return { type, list, spell };
}

function parseV3Payload(input, base) {
  if (!Array.isArray(input.operations)) {
    throw new Error('operations must be an array.');
  }

  const operations = input.operations.map((op, index) => normalizeSpellOp(op, index));

  let issues = [];
  if (input.issues !== undefined) {
    if (!Array.isArray(input.issues)) {
      throw new Error('issues must be an array when provided.');
    }
    issues = input.issues.map((entry, index) => normalizeIssueEntry(entry, index));
  }

  if (!input.character || typeof input.character !== 'object') {
    throw new Error('character must be an object.');
  }

  const id = asString(input.character.id);
  const name = normalizeWhitespace(input.character.name);
  if (!id) throw new Error('character.id is required.');
  if (!name) throw new Error('character.name is required.');

  return {
    ...base,
    version: 3,
    character: { id, name },
    operations,
    issues,
  };
}

export function parseSyncPayload(input) {
  try {
    if (!input || typeof input !== 'object') {
      throw new Error('Payload must be an object.');
    }

    if (input.source !== 'spellbook') {
      throw new Error('Payload source must be spellbook.');
    }

    const timestamp = Number(input.timestamp);
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      throw new Error('timestamp must be a positive number.');
    }

    const base = {
      source: 'spellbook',
      timestamp,
    };

    const version = Number(input.version);
    if (version === 3) {
      return { ok: true, payload: parseV3Payload(input, base) };
    }

    throw new Error('Payload version must be 3.');
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid payload.',
    };
  }
}

export function summarizeOpsPreview(payloadV3) {
  if (!payloadV3 || payloadV3.version !== 3 || !Array.isArray(payloadV3.operations)) {
    throw new Error('summarizeOpsPreview requires a version 3 payload.');
  }

  const perListMap = new Map();
  const totals = {
    replace: 0,
    prepare: 0,
    unprepare: 0,
    operations: payloadV3.operations.length,
  };

  for (const operation of payloadV3.operations) {
    const list = normalizeListName(operation.list);
    if (!perListMap.has(list)) {
      perListMap.set(list, {
        list,
        replace: 0,
        prepare: 0,
        unprepare: 0,
        total: 0,
      });
    }

    const bucket = perListMap.get(list);
    if (operation.type === 'replace') {
      bucket.replace += 1;
      totals.replace += 1;
    }
    if (operation.type === 'prepare') {
      bucket.prepare += 1;
      totals.prepare += 1;
    }
    if (operation.type === 'unprepare') {
      bucket.unprepare += 1;
      totals.unprepare += 1;
    }
    bucket.total += 1;
  }

  const skippedFromPayload = Array.isArray(payloadV3.issues) ? payloadV3.issues : [];

  return {
    mode: 'ops',
    perList: [...perListMap.values()],
    totals,
    actionCount: totals.operations,
    listCount: perListMap.size,
    skippedFromPayload,
    skippedCount: skippedFromPayload.length,
    alreadyCorrect: totals.operations === 0,
    durationMs: 0,
  };
}

export function extractDndBeyondCharacterId(urlValue) {
  if (!urlValue) return null;

  let parsedUrl;
  try {
    parsedUrl = new URL(urlValue);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== 'https:') return null;
  if (parsedUrl.hostname.toLowerCase() !== 'www.dndbeyond.com') return null;

  const parts = parsedUrl.pathname.split('/').filter(Boolean);

  if (parts[0] === 'characters') {
    const id = parts[1] || '';
    if (!/^\d+$/.test(id)) return null;
    if (parts.length === 2) return id;
    if (parts.length === 3 && parts[2] === 'edit') return id;
    return null;
  }

  if (parts[0] === 'profile') {
    const user = parts[1] || '';
    const marker = parts[2] || '';
    const id = parts[3] || '';
    if (!user || marker !== 'characters' || !/^\d+$/.test(id)) return null;
    if (parts.length === 4) return id;
    if (parts.length === 5 && parts[4] === 'edit') return id;
    return null;
  }

  return null;
}

export function isDndBeyondCharacterUrl(urlValue) {
  return Boolean(extractDndBeyondCharacterId(urlValue));
}
