/**
 * Bypasser — 5-Tier Cloudflare bypass engine.
 * Handles charset decoding (UTF-8, GBK, Big5), UA rotation, rate limiting,
 * session cookie caching, and challenge detection.
 *
 * Adapted from: https://github.com/Parasgaming122/NovelReaderAi/blob/main/src/lib/bypasser.ts
 */

import iconv from 'iconv-lite';

// ─── Session Cache ───────────────────────────────────────────

interface SessionCacheEntry {
  cookies: string[];
  expiresAt: number;
}

const sessionCache = new Map<string, SessionCacheEntry>();

// ─── Rate Limiter ────────────────────────────────────────────

const lastRequestTime = new Map<string, number>();
const MIN_DOMAIN_DELAY_MS = 600;

// ─── UA Pool ────────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

const SEC_CH_UA = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';

// ─── Helpers ────────────────────────────────────────────────

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function extractDomain(urlStr: string): string {
  try { return new URL(urlStr).hostname; }
  catch { return 'default'; }
}

function isChallenge(body: string, status: number): boolean {
  if (status === 403 || status === 503 || status === 429) return true;
  if (!body || body.length < 200) return false;
  const patterns = [
    '<title>Just a moment...',
    'cf-browser-verification',
    'challenge-platform',
    'challenge-running',
    '_cf_chl',
    'cdn-cgi/challenge',
    'challenges.cloudflare.com',
    'hcaptcha.com',
    'g-recaptcha',
    'turnstile',
    // Custom site-level JS challenges
    '\u6b63\u5728\u9a8c\u8bc1\u6d4f\u89c8\u5668',     // 正在验证浏览器 (ixdzs8)
    '\u5b89\u5168\u9a8c\u8bc1',                   // 安全验证 (generic)
    'window.location.href.*challenge',         // JS redirect challenges
    '\u8bf7\u7a0d\u7b49',                     // 请稍等 (generic wait)
  ];
  return patterns.some(p => body.toLowerCase().includes(p.toLowerCase()));
}

function enforceRateLimit(domain: string): Promise<void> {
  const lastTime = lastRequestTime.get(domain) || 0;
  const elapsed = Date.now() - lastTime;
  if (elapsed < MIN_DOMAIN_DELAY_MS) {
    return new Promise(r => setTimeout(r, MIN_DOMAIN_DELAY_MS - elapsed));
  }
  lastRequestTime.set(domain, Date.now());
  return Promise.resolve();
}

// ─── Public Types ────────────────────────────────────────────

export interface BypassRequestOptions {
  method?: string;
  body?: string | Buffer;
  headers?: Record<string, string>;
  charset?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface BypassResponse {
  success: boolean;
  status: number;
  body: string;
  url: string;
  tierUsed: number;
  cookies?: string[];
  error?: string;
}

/** Encode a string as GBK percent-encoded for URL params. */
export function encodeGBKComponent(str: string): string {
  try {
    const buf = iconv.encode(str, 'gbk');
    let result = '';
    for (let i = 0; i < buf.length; i++) {
      result += '%' + buf[i].toString(16).toUpperCase().padStart(2, '0');
    }
    return result;
  } catch {
    return encodeURIComponent(str);
  }
}

/** Encode a string as Big5 percent-encoded for URL params. */
export function encodeBig5Component(str: string): string {
  try {
    const buf = iconv.encode(str, 'big5');
    let result = '';
    for (let i = 0; i < buf.length; i++) {
      result += '%' + buf[i].toString(16).toUpperCase().padStart(2, '0');
    }
    return result;
  } catch {
    return encodeURIComponent(str);
  }
}

// ─── Main Fetch ─────────────────────────────────────────────

export async function smartFetch(
  url: string,
  options: BypassRequestOptions = {}
): Promise<BypassResponse> {
  const domain = extractDomain(url);
  const maxRetries = options.maxRetries ?? 2;
  const timeout = options.timeout ?? 15000;
  const declaredCharset = (options.charset || 'UTF-8').toUpperCase();
  const isGBK = declaredCharset.includes('GBK') || declaredCharset.includes('GB2312');
  const isBig5 = declaredCharset.includes('BIG5') || declaredCharset.includes('TRADITIONAL');

  await enforceRateLimit(domain);

  const cachedSession = sessionCache.get(domain);
  let cookiesToUse =
    cachedSession && cachedSession.expiresAt > Date.now()
      ? cachedSession.cookies
      : [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const tier = attempt === 1 && cachedSession ? 2 : attempt === 1 ? 1 : 3;
    const ua = getRandomUA();

    const headers: Record<string, string> = {
      'User-Agent': ua,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'sec-ch-ua': SEC_CH_UA,
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      ...options.headers,
    };

    if (cookiesToUse.length > 0) {
      headers['Cookie'] = cookiesToUse.join('; ');
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const bodyInit = options.body
        ? typeof options.body === 'string'
          ? options.body
          : new Uint8Array(options.body)
        : undefined;

      const res = await fetch(url, {
        method: options.method || 'GET',
        body: bodyInit,
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timer);

      // Collect cookies
      const resCookies: string[] = [];
      res.headers.forEach((val, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          resCookies.push(val.split(';')[0]);
        }
      });
      if (resCookies.length > 0) {
        cookiesToUse = Array.from(new Set([...cookiesToUse, ...resCookies]));
        sessionCache.set(domain, {
          cookies: cookiesToUse,
          expiresAt: Date.now() + 3600 * 1000,
        });
      }

      // Decode body with proper charset
      const contentType = res.headers.get('content-type') || '';
      const ctCharset = (contentType.match(/charset=([\w-]+)/i) || [])[1]?.toUpperCase();
      const ctIsGBK = ctCharset?.includes('GBK') || ctCharset?.includes('GB2312');
      const ctIsBig5 = ctCharset?.includes('BIG5');

      // Content-Type charset takes priority over plugin-declared charset
      const useGBK = ctIsGBK || (isGBK && !ctCharset);
      const useBig5 = ctIsBig5 || (isBig5 && !ctCharset);
      const needsIconv = useGBK || useBig5;

      let body: string;
      if (needsIconv) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        body = iconv.decode(buffer, useGBK ? 'gbk' : 'big5');
      } else {
        body = await res.text();
      }

      if (!isChallenge(body, res.status) && res.status >= 200 && res.status < 400) {
        return { success: true, status: res.status, body, url: res.url, tierUsed: tier, cookies: cookiesToUse };
      }

      // Blocked — invalidate cache
      sessionCache.delete(domain);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1500));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fetch error';
      if (attempt === maxRetries) {
        return { success: false, status: 500, body: '', url, tierUsed: 4, error: msg };
      }
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }

  return { success: false, status: 403, body: '', url, tierUsed: 4, error: 'Exhausted retries' };
}

/** Reset session cache (useful for testing). */
export function clearSessionCache(): void {
  sessionCache.clear();
}
