/**
 * Resilient JSON fetch utility that prevents the dreaded:
 * "Unexpected token '<', '<!doctype '... is not valid JSON"
 * error when a static hosting CDN serves index.html on missing API routes.
 */
export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';

  // If the server answered with HTML (e.g. Firebase Hosting rewriting 404 to /index.html)
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().startsWith('<')) {
      throw new Error(
        'The backend API is not connected on this static web host. If using Firebase Hosting, deploy the Cloud Run/Functions backend, or run locally via npm run dev.'
      );
    }
    throw new Error(`Unexpected non-JSON response from server (status ${res.status}): ${text.slice(0, 80)}`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}
