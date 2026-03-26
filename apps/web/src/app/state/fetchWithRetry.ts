/**
 * Fetch wrapper that retries on network errors and 502/503/504 responses.
 * Handles cold-start delays on free-tier hosting.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(input, init);

      if (attempt < maxRetries && (res.status === 502 || res.status === 503 || res.status === 504)) {
        await delay(1000 * (attempt + 1));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await delay(1000 * (attempt + 1));
      }
    }
  }

  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
