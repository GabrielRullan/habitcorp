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

  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (networkErr: any) {
    // If network failed completely (offline / server down), fallback to client-side local store
    if (urlStr.startsWith('/api/v1/')) {
      return handleClientStorageRequest(urlStr, init);
    }
    throw networkErr;
  }

  const contentType = res.headers.get('content-type') || '';

  // If static hosting returned HTML or non-JSON instead of API JSON (e.g. Firebase Hosting rewrite)
  if (!contentType.includes('application/json')) {
    if (urlStr.startsWith('/api/v1/')) {
      return handleClientStorageRequest(urlStr, init);
    }
    const text = await res.text();
    throw new Error(`Unexpected non-JSON response from server (status ${res.status}): ${text.slice(0, 80)}`);
  }

  // If 404 from a static CDN server for an API path
  if (res.status === 404 && urlStr.startsWith('/api/v1/')) {
    const data = await res.json().catch(() => null);
    if (!data || !data.error) {
      return handleClientStorageRequest(urlStr, init);
    }
    throw new Error(data.error);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}
