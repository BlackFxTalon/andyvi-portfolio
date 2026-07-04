import { z } from 'astro/zod';
import type { ContactEmailInput } from '@/server/email';

export const CONTACT_FIELD_LIMITS = {
  nameMax: 80,
  emailMax: 254,
  messageMin: 10,
  messageMax: 5_000,
  honeypotMax: 200,
} as const;

const requiredTrimmedString = (field: string, maxLength: number) =>
  z.string().trim().min(1, `${field} is required.`).max(maxLength, `${field} is too long.`);

export const contactActionInputSchema = z.object({
  name: requiredTrimmedString('Name', CONTACT_FIELD_LIMITS.nameMax),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .max(CONTACT_FIELD_LIMITS.emailMax, 'Email is too long.')
    .pipe(z.email('Enter a valid email address.')),
  message: z
    .string()
    .trim()
    .min(CONTACT_FIELD_LIMITS.messageMin, 'Message is too short.')
    .max(CONTACT_FIELD_LIMITS.messageMax, 'Message is too long.'),
  website: z.string().trim().max(CONTACT_FIELD_LIMITS.honeypotMax).nullable().optional(),
});

export type ContactActionInput = z.infer<typeof contactActionInputSchema>;

export type ContactActionErrorCode = 'rate_limited' | 'delivery_unavailable';

export interface ContactActionErrorEnvelope {
  code: ContactActionErrorCode;
  message: string;
  retryAfterSeconds?: number;
}

export type ContactActionResult =
  | {
      ok: true;
      status: 'accepted';
    }
  | {
      ok: false;
      error: ContactActionErrorEnvelope;
    };

export interface ContactActionRuntimeContext {
  clientAddress: string;
  request: Request;
}

export interface ContactActionRateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export interface ContactActionDependencies {
  sendEmail: (input: ContactEmailInput) => Promise<void>;
  checkRateLimit: (context: ContactActionRuntimeContext) => ContactActionRateLimitResult;
  isHoneypotFilled: (value: unknown) => boolean;
}

const ACCEPTED_RESPONSE = {
  ok: true,
  status: 'accepted',
} as const satisfies ContactActionResult;

function toRetryAfterSeconds(retryAfterMs: number): number {
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
}

export async function handleContactAction(
  input: ContactActionInput,
  context: ContactActionRuntimeContext,
  dependencies: ContactActionDependencies,
): Promise<ContactActionResult> {
  const rateLimit = dependencies.checkRateLimit(context);

  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: {
        code: 'rate_limited',
        message: 'Please wait before sending another message.',
        retryAfterSeconds: toRetryAfterSeconds(rateLimit.retryAfterMs),
      },
    };
  }

  if (dependencies.isHoneypotFilled(input.website)) {
    return ACCEPTED_RESPONSE;
  }

  try {
    await dependencies.sendEmail({
      name: input.name,
      email: input.email,
      message: input.message,
    });
  } catch {
    return {
      ok: false,
      error: {
        code: 'delivery_unavailable',
        message: 'Message could not be sent right now. Please try again later.',
      },
    };
  }

  return ACCEPTED_RESPONSE;
}
