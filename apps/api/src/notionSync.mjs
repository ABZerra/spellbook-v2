const NOTION_VERSION = '2022-06-28';

const DEFAULT_PROPERTY_MAP = {
  spellId: 'Spell ID',
  name: 'Name',
  level: 'Level',
  source: 'Source',
  spellList: 'Spell List',
  save: 'Save',
  castingTime: 'Casting Time',
  notes: 'Notes',
  description: 'Description',
  school: 'School',
  duration: 'Duration',
  range: 'Range',
  components: 'Components',
  tags: 'Tags',
  archived: 'Archived'
};

function asText(prop) {
  if (!prop) return '';
  const read = (entry) => entry?.plain_text || entry?.text?.content || '';
  if (Array.isArray(prop.title)) return prop.title.map(read).join('').trim();
  if (Array.isArray(prop.rich_text)) return prop.rich_text.map(read).join('').trim();
  if (prop.type === 'title') return (prop.title || []).map(read).join('').trim();
  if (prop.type === 'rich_text') return (prop.rich_text || []).map(read).join('').trim();
  return '';
}

function asList(prop) {
  if (!prop) return [];
  if (Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((entry) => String(entry?.name || '').trim()).filter(Boolean);
  }
  if (prop.select?.name) return [String(prop.select.name).trim()].filter(Boolean);
  const text = asText(prop);
  return text ? text.split(',').map((entry) => entry.trim()).filter(Boolean) : [];
}

function asSelect(prop) {
  if (!prop) return '';
  if (prop.select?.name) return String(prop.select.name).trim();
  return asText(prop);
}

function asLevel(prop) {
  const parsed = Number(prop?.number ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
}

function toSpell(page, propertyMap) {
  const p = page.properties || {};
  const id = asText(p[propertyMap.spellId]);
  const name = asText(p[propertyMap.name]);
  if (!id || !name) return null;

  const archived = Boolean(page.archived) || Boolean(p[propertyMap.archived]?.checkbox);
  if (archived) return null;

  return {
    id,
    name,
    level: asLevel(p[propertyMap.level]),
    source: asList(p[propertyMap.source]),
    spellList: asList(p[propertyMap.spellList]),
    save: asSelect(p[propertyMap.save]),
    castingTime: asSelect(p[propertyMap.castingTime]),
    notes: asText(p[propertyMap.notes]),
    description: asText(p[propertyMap.description]),
    school: asSelect(p[propertyMap.school]),
    duration: asSelect(p[propertyMap.duration]),
    range: asSelect(p[propertyMap.range]),
    components: asText(p[propertyMap.components]),
    tags: asList(p[propertyMap.tags])
  };
}

async function notionRequest(path, { method = 'GET', body, token, fetchImpl }) {
  const response = await fetchImpl(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.message || `${method} ${path} failed (${response.status})`;
    const error = new Error(detail);
    error.statusCode = response.status;
    throw error;
  }

  return payload;
}

export async function syncSpellsFromNotion({ token, databaseId, fetchImpl = globalThis.fetch, propertyMap = DEFAULT_PROPERTY_MAP }) {
  if (!token) throw new Error('NOTION_API_TOKEN is required.');
  if (!databaseId) throw new Error('NOTION_DATABASE_ID is required.');
  if (typeof fetchImpl !== 'function') throw new Error('Fetch implementation is unavailable.');

  const spells = [];
  let cursor = undefined;

  while (true) {
    const payload = await notionRequest(`/databases/${databaseId}/query`, {
      method: 'POST',
      token,
      fetchImpl,
      body: {
        page_size: 100,
        start_cursor: cursor
      }
    });

    for (const page of payload.results || []) {
      const spell = toSpell(page, propertyMap);
      if (!spell) continue;
      spells.push(spell);
    }

    if (!payload.has_more || !payload.next_cursor) break;
    cursor = payload.next_cursor;
  }

  spells.sort((left, right) => {
    if (left.level !== right.level) return left.level - right.level;
    return left.name.localeCompare(right.name);
  });

  return {
    spells,
    refreshedAt: new Date().toISOString()
  };
}
