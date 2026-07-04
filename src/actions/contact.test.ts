import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  contactActionInputSchema,
  handleContactAction,
  type ContactActionInput,
  type ContactActionRuntimeContext,
} from './contactCore.ts';

function createActionContext(): ContactActionRuntimeContext {
  return {
    clientAddress: '203.0.113.10',
    request: new Request('https://andyvi.ru/contacts', { method: 'POST' }),
  };
}

const validInput: ContactActionInput = {
  name: 'Andy',
  email: 'andy@example.com',
  message: 'I need help with a production frontend migration.',
  website: '',
};

describe('contact action validation', () => {
  it('trims accepted fields and keeps the website honeypot optional', () => {
    const parsed = contactActionInputSchema.parse({
      name: '  Andy  ',
      email: '  andy@example.com  ',
      message: '  I need help with a production frontend migration.  ',
    });

    assert.deepEqual(parsed, {
      name: 'Andy',
      email: 'andy@example.com',
      message: 'I need help with a production frontend migration.',
    });
  });

  it('enforces required fields, email shape, and maximum lengths server-side', () => {
    const result = contactActionInputSchema.safeParse({
      name: '',
      email: 'not-an-email',
      message: 'short',
      website: 'x'.repeat(201),
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.deepEqual(
        result.error.issues.map((issue) => issue.path.join('.')).sort(),
        ['email', 'message', 'name', 'website'],
      );
    }
  });
});

describe('contact action handler', () => {
  it('checks rate limit before sending email', async () => {
    let sendCount = 0;

    const result = await handleContactAction(validInput, createActionContext(), {
      checkRateLimit: () => ({
        allowed: false,
        retryAfterMs: 12_500,
      }),
      isHoneypotFilled: () => false,
      sendEmail: async () => {
        sendCount += 1;
      },
    });

    assert.equal(sendCount, 0);
    assert.deepEqual(result, {
      ok: false,
      error: {
        code: 'rate_limited',
        message: 'Please wait before sending another message.',
        retryAfterSeconds: 13,
      },
    });
  });

  it('accepts honeypot submissions without calling SMTP', async () => {
    let sendCount = 0;
    let rateLimitCount = 0;

    const result = await handleContactAction(
      { ...validInput, website: 'https://spam.example' },
      createActionContext(),
      {
        checkRateLimit: () => {
          rateLimitCount += 1;

          return {
            allowed: true,
            retryAfterMs: 0,
          };
        },
        isHoneypotFilled: (value) => typeof value === 'string' && value.trim().length > 0,
        sendEmail: async () => {
          sendCount += 1;
        },
      },
    );

    assert.equal(rateLimitCount, 1);
    assert.equal(sendCount, 0);
    assert.deepEqual(result, { ok: true, status: 'accepted' });
  });

  it('sends trimmed contact input through the injected email sender', async () => {
    let sentInput: ContactActionInput | undefined;

    const result = await handleContactAction(
      {
        name: 'Andy',
        email: 'andy@example.com',
        message: 'I need help with a production frontend migration.',
        website: null,
      },
      createActionContext(),
      {
        checkRateLimit: () => ({
          allowed: true,
          retryAfterMs: 0,
        }),
        isHoneypotFilled: () => false,
        sendEmail: async (input) => {
          sentInput = input;
        },
      },
    );

    assert.deepEqual(result, { ok: true, status: 'accepted' });
    assert.deepEqual(sentInput, {
      name: 'Andy',
      email: 'andy@example.com',
      message: 'I need help with a production frontend migration.',
    });
  });

  it('returns a generic non-PII envelope when delivery fails', async () => {
    const result = await handleContactAction(validInput, createActionContext(), {
      checkRateLimit: () => ({
        allowed: true,
        retryAfterMs: 0,
      }),
      isHoneypotFilled: () => false,
      sendEmail: async () => {
        throw new Error('SMTP password rejected for andy@example.com');
      },
    });

    assert.deepEqual(result, {
      ok: false,
      error: {
        code: 'delivery_unavailable',
        message: 'Message could not be sent right now. Please try again later.',
      },
    });
    assert.doesNotMatch(JSON.stringify(result), /andy@example\.com|SMTP|password/i);
  });
});
