/**
 * SSRF-Safe HTTP Fetch Service
 * Validates target URLs to prevent internal network scanning and cloud metadata access.
 */

const PRIVATE_IP_RANGES = [
  /^127\./,                         // Loopback
  /^10\./,                          // RFC 1918 Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC 1918 Class B
  /^192\.168\./,                    // RFC 1918 Class C
  /^169\.254\./,                    // Link-local / Cloud Metadata (AWS, GCP, Azure)
  /^0\./,                           // Current network
  /^fc00:/i,                        // IPv6 Unique local
  /^fe80:/i,                        // IPv6 Link-local
  /^::1$/,                          // IPv6 Loopback
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'metadata.google.internal',
  'instance-data',
];

/**
 * Normalizes user-entered calendar feed URLs:
 * - Translates `webcal://` and `webcals://` schemes to `https://`
 * - Upgrades insecure `http://calendar.google.com` to `https://`
 * - Auto-transforms Google Calendar share/embed links (`embed?src=` or `u/0?cid=`) to the direct public .ics endpoint
 */
export function normalizeCalendarUrl(rawUrl: string): string {
  let clean = (rawUrl || '').trim().replace(/^["']|["']$/g, '');

  if (clean.toLowerCase().startsWith('webcal://')) {
    clean = 'https://' + clean.slice('webcal://'.length);
  } else if (clean.toLowerCase().startsWith('webcals://')) {
    clean = 'https://' + clean.slice('webcals://'.length);
  } else if (clean.toLowerCase().startsWith('http://calendar.google.com/')) {
    clean = 'https://calendar.google.com/' + clean.slice('http://calendar.google.com/'.length);
  }

  // Convert Google Calendar embed / cid links into direct .ics iCal endpoint
  try {
    const parsed = new URL(clean);
    if (parsed.hostname.toLowerCase().includes('calendar.google.com')) {
      const src = parsed.searchParams.get('src') || parsed.searchParams.get('cid');
      if (src && !parsed.pathname.toLowerCase().includes('/ical/')) {
        return `https://calendar.google.com/calendar/ical/${encodeURIComponent(src)}/public/basic.ics`;
      }
    }
  } catch {
    // If not a valid URL yet, return raw clean string
  }

  return clean;
}

export function isSafeUrl(rawUrl: string): boolean {
  try {
    const normalized = normalizeCalendarUrl(rawUrl);
    const parsed = new URL(normalized);
    
    // Only allow HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return false;
    }

    // Check private IP regexes
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export async function safeFetch(rawUrl: string, options: RequestInit = {}): Promise<Response> {
  const normalized = normalizeCalendarUrl(rawUrl);
  if (!isSafeUrl(normalized)) {
    throw new Error('SSRF Protection: Access to private, local, or loopback network addresses is blocked.');
  }

  // Enforce a 12s timeout if signal is not already provided
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const customHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; HabitCorpCalendar/1.0; +https://habitcorp.app)',
    'Accept': 'text/calendar, application/calendar+xml, text/plain, */*',
  };

  if (options.headers) {
    if (typeof (options.headers as any).entries === 'function') {
      for (const [k, v] of (options.headers as any).entries()) {
        customHeaders[k] = v;
      }
    } else if (typeof options.headers === 'object') {
      Object.assign(customHeaders, options.headers);
    }
  }

  try {
    const res = await fetch(normalized, {
      ...options,
      headers: customHeaders,
      signal: options.signal || controller.signal,
      redirect: 'follow',
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}
