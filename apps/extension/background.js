import {
  extractDndBeyondCharacterId,
  isDndBeyondCharacterUrl,
  summarizeOpsPreview,
} from './payload-utils.js';
import { loadStoredPayloadState } from './background-state.js';

const SYNC_PAYLOAD_STORAGE_KEY = 'spellbook.syncPayload.v1';

async function getPayload() {
  const stored = await chrome.storage.local.get(SYNC_PAYLOAD_STORAGE_KEY);
  return stored[SYNC_PAYLOAD_STORAGE_KEY] || null;
}

function dedupeSpellNames(spellNames) {
  const seen = new Set();
  const output = [];
  for (const name of spellNames) {
    const raw = String(name || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(raw);
  }
  return output;
}

async function getPayloadWithFallback() {
  return loadStoredPayloadState(getPayload);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function buildPopupStatus() {
  const tab = await getActiveTab();
  const payloadState = await getPayloadWithFallback();
  const payload = payloadState.payload;
  const tabUrl = tab?.url || '';
  const tabCharacterId = extractDndBeyondCharacterId(tabUrl);
  const ddbCharacterPage = isDndBeyondCharacterUrl(tabUrl);

  return {
    ok: true,
    tab: {
      id: tab?.id ?? null,
      url: tabUrl || null,
      ddbCharacterPage,
      characterId: tabCharacterId,
    },
    payload: payload || null,
    payloadError: payloadState.payloadError,
    hydrated: payloadState.hydrated,
  };
}

async function handleSyncRequest() {
  const tab = await getActiveTab();
  if (!tab || typeof tab.id !== 'number') {
    return { ok: false, error: 'No active tab found.' };
  }

  const url = tab.url || '';
  const tabCharacterId = extractDndBeyondCharacterId(url);
  if (!tabCharacterId) {
    return {
      ok: false,
      error: 'Active tab is not a D&D Beyond character page.',
      tabUrl: url || null,
    };
  }

  const payloadState = await getPayloadWithFallback();
  const payload = payloadState.payload;
  if (!payload) {
    return { ok: false, error: payloadState.payloadError || 'No Spellbook payload found.' };
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'SYNC_EXECUTE',
      payload,
      context: {
        tabUrl: url,
        tabCharacterId,
      },
    });

    if (!response || !response.ok) {
      return {
        ok: false,
        error: response?.error || 'Sync did not return a successful result.',
        debugLog: Array.isArray(response?.debugLog) ? response.debugLog : undefined,
      };
    }

    return {
      ok: true,
      result: response.result,
    };
  } catch {
    return {
      ok: false,
      error: 'Unable to reach content script. Refresh the D&D Beyond tab and try again.',
    };
  }
}

async function handlePreviewRequest() {
  const tab = await getActiveTab();
  if (!tab || typeof tab.id !== 'number') {
    return { ok: false, error: 'No active tab found.' };
  }

  const url = tab.url || '';
  const tabCharacterId = extractDndBeyondCharacterId(url);
  if (!tabCharacterId) {
    return {
      ok: false,
      error: 'Active tab is not a D&D Beyond character page.',
      tabUrl: url || null,
    };
  }

  const payloadState = await getPayloadWithFallback();
  const payload = payloadState.payload;
  if (!payload) {
    return { ok: false, error: payloadState.payloadError || 'No Spellbook payload found.' };
  }

  if (payload.version === 3) {
    return {
      ok: true,
      preview: summarizeOpsPreview(payload),
    };
  }

  return {
    ok: false,
    error: 'Only v3 payloads are supported.',
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    sendResponse({ ok: false, error: 'Invalid message.' });
    return;
  }

  if (message.type === 'POPUP_INIT') {
    void buildPopupStatus().then(sendResponse);
    return true;
  }

  if (message.type === 'SYNC_REQUEST') {
    void handleSyncRequest().then(sendResponse);
    return true;
  }

  if (message.type === 'PREVIEW_REQUEST') {
    void handlePreviewRequest().then(sendResponse);
    return true;
  }

  if (message.type === 'SYNC_PROGRESS' || message.type === 'SYNC_RESULT') {
    if (sender?.tab?.id) {
      chrome.runtime.sendMessage(message).catch(() => {
        // Popup may be closed.
      });
    }
    sendResponse({ ok: true });
    return;
  }

  sendResponse({ ok: false, error: `Unknown message type: ${String(message.type)}` });
});
