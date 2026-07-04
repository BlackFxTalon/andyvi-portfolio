import { createHash } from 'node:crypto';
import { ActionError } from 'astro:actions';

interface ContactRateLimitContext {
  clientAddress?: string;
  request?: Request;
}

interface ContactRateLimitPolicy {
  maxAttempts?: number;
  windowMs?: number;
  maxEntries?: number;
  now?: number;
}

interface ContactRateLimitBucket {
  attempts: number;
  expiresAt: number;
  lastSeenAt: number;
}

export interface ContactRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetAt: number;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 1000;

const contactBuckets = new Map<string, ContactRateLimitBucket>();

export function isContactHoneypotFilled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function resetContactRateLimit(): void {
  contactBuckets.clear();
}

function normalizePolicy(policy: ContactRateLimitPolicy) {
  return {
    maxAttempts: Math.max(1, Math.floor(policy.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)),
    windowMs: Math.max(1, Math.floor(policy.windowMs ?? DEFAULT_WINDOW_MS)),
    maxEntries: Math.max(1, Math.floor(policy.maxEntries ?? DEFAULT_MAX_ENTRIES)),
    now: Math.floor(policy.now ?? Date.now()),
  };
}

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(',')[0]?.trim() || undefined;
}

function getClientIdentifier(context: ContactRateLimitContext): string {
  return (
    context.clientAddress?.trim() ||
    firstHeaderValue(context.request?.headers.get('x-real-ip') ?? null) ||
    firstHeaderValue(context.request?.headers.get('x-forwarded-for') ?? null) ||
    'unknown-client'
  );
}

function hashIdentifier(identifier: string): string {
  return createHash('sha256').update(identifier).digest('base64url');
}

function toBucketKey(contextOrKey: ContactRateLimitContext | string): string {
  const identifier =
    typeof contextOrKey === 'string' ? contextOrKey : getClientIdentifier(contextOrKey);

  return `contact:${hashIdentifier(identifier)}`;
}

function pruneBuckets(now: number, maxEntries: number): void {
  for (const [key, bucket] of contactBuckets) {
    if (bucket.expiresAt <= now) {
      contactBuckets.delete(key);
    }
  }

  if (contactBuckets.size <= maxEntries) {
    return;
  }

  const overflow = contactBuckets.size - maxEntries;
  const oldest = [...contactBuckets.entries()]
    .sort((left, right) => {
      const expiresDelta = left[1].expiresAt - right[1].expiresAt;
      return expiresDelta || left[1].lastSeenAt - right[1].lastSeenAt;
    })
    .slice(0, overflow);

  for (const [key] of oldest) {
    contactBuckets.delete(key);
  }
}

export function checkContactRateLimit(
  contextOrKey: ContactRateLimitContext | string,
  policy: ContactRateLimitPolicy = {},
): ContactRateLimitResult {
  const normalized = normalizePolicy(policy);

  pruneBuckets(normalized.now, normalized.maxEntries);

  const key = toBucketKey(contextOrKey);
  const existing = contactBuckets.get(key);
  const bucket =
    existing && existing.expiresAt > normalized.now
      ? existing
      : {
          attempts: 0,
          expiresAt: normalized.now + normalized.windowMs,
          lastSeenAt: normalized.now,
        };

  bucket.lastSeenAt = normalized.now;

  if (bucket.attempts >= normalized.maxAttempts) {
    contactBuckets.set(key, bucket);
    pruneBuckets(normalized.now, normalized.maxEntries);

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, bucket.expiresAt - normalized.now),
      resetAt: bucket.expiresAt,
    };
  }

  bucket.attempts += 1;
  contactBuckets.set(key, bucket);
  pruneBuckets(normalized.now, normalized.maxEntries);

  return {
    allowed: true,
    remaining: Math.max(0, normalized.maxAttempts - bucket.attempts),
    retryAfterMs: 0,
    resetAt: bucket.expiresAt,
  };
}

export function assertContactRateLimit(
  contextOrKey: ContactRateLimitContext | string,
  policy: ContactRateLimitPolicy = {},
): ContactRateLimitResult {
  const result = checkContactRateLimit(contextOrKey, policy);

  if (!result.allowed) {
    throw new ActionError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many contact attempts. Please try again later.',
    });
  }

  return result;
}
