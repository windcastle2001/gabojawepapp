import { lookup } from 'dns/promises';
import net from 'net';

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

function isBlockedIPv4(ip: string) {
  const parts = ip.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIPv6(ip: string) {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  );
}

function isBlockedAddress(address: string) {
  const family = net.isIP(address);
  if (family === 4) return isBlockedIPv4(address);
  if (family === 6) return isBlockedIPv6(address);
  return true;
}

export async function assertSafeFetchUrl(rawUrl: string, baseUrl?: string) {
  const parsed = new URL(rawUrl, baseUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs with credentials are not allowed.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.localhost')) {
    throw new Error('Localhost URLs are not allowed.');
  }

  const literalFamily = net.isIP(hostname);
  if (literalFamily && isBlockedAddress(hostname)) {
    throw new Error('Private or local network URLs are not allowed.');
  }

  if (!literalFamily) {
    const records = await lookup(hostname, { all: true, verbatim: true });
    if (!records.length || records.some((record) => isBlockedAddress(record.address))) {
      throw new Error('Private or local network URLs are not allowed.');
    }
  }

  return parsed;
}

export async function safeFetch(rawUrl: string, init: RequestInit = {}, maxRedirects = 3) {
  let current = await assertSafeFetchUrl(rawUrl);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetch(current.href, {
      ...init,
      redirect: 'manual',
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) return response;

    const location = response.headers.get('location');
    if (!location) return response;
    current = await assertSafeFetchUrl(location, current.href);
  }

  throw new Error('Too many redirects.');
}

export async function safeResolveRedirectUrl(rawUrl: string, maxRedirects = 3) {
  let current = await assertSafeFetchUrl(rawUrl);

  for (let redirectCount = 0; redirectCount < maxRedirects; redirectCount += 1) {
    const response = await fetch(current.href, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    const location = response.headers.get('location');
    if (!location || ![301, 302, 303, 307, 308].includes(response.status)) break;
    current = await assertSafeFetchUrl(location, current.href);
  }

  return current.href;
}
