/**
 * Resilient JSON fetch utility with automatic Local-First Storage fallback
 * Prevents "Unexpected token '<', '<!doctype '... is not valid JSON"
 * by seamlessly falling back to in-browser storage when static CDN hosting is detected.
 */

import { handleClientStorageRequest } from './clientStore';

export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const urlStr = typeof input === 'string' ? input : input.toString();

  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';

    // If static hosting returned HTML or non-JSON instead of API JSON (e.g. Firebase Hosting rewrite)
    if (!contentType.includes('application/json')) {
      if (urlStr.startsWith('/api/v1/')) {
        return handleClientStorageRequest(urlStr, init);
      }
      const text = await res.text();
      throw new Error(`Unexpected non-JSON response from server (status ${res.status}): ${text.slice(0, 80)}`);
    }

    if (res.status === 404 && urlStr.startsWith('/api/v1/')) {
      return handleClientStorageRequest(urlStr, init);
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err: any) {
    // If network failed completely or returned non-JSON, fallback to client-side local-first store
    if (urlStr.startsWith('/api/v1/')) {
      return handleClientStorageRequest(urlStr, init);
    }
    throw err;
  }
}
