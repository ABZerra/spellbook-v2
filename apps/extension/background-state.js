import { parseSyncPayload } from './payload-utils.js';

export async function loadStoredPayloadState(readStoredPayload) {
  const storedPayload = await readStoredPayload();
  const storedValidation = parseSyncPayload(storedPayload);
  if (storedValidation.ok) {
    return {
      payload: storedValidation.payload,
      hydrated: false,
      payloadError: null,
    };
  }

  return {
    payload: null,
    hydrated: false,
    payloadError: 'No Spellbook payload available yet. Generate one from the web app before syncing.',
  };
}
