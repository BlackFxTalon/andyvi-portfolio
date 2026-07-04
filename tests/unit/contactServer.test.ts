import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  installAstroActionsMock,
  setAstroActionsMock,
} from "../helpers/astroActionsMock.ts";
import {
  contactActionInputSchema,
  handleContactAction,
  type ContactActionInput,
} from "../../src/actions/contactCore.ts";

installAstroActionsMock();

const {
  assertContactRateLimit,
  checkContactRateLimit,
  isContactHoneypotFilled,
  resetContactRateLimit,
} = await import("../../src/server/rateLimit.ts");

const validInput = {
  name: "Andy",
  email: "andy@example.com",
  message: "I need help with a production frontend migration.",
  website: "",
} satisfies ContactActionInput;

beforeEach(() => {
  resetContactRateLimit();
  setAstroActionsMock({});
});

describe("contact validation and anti-spam helpers", () => {
  it("trims accepted contact action input and rejects boundary failures", () => {
    const parsed = contactActionInputSchema.parse({
      name: "  Andy  ",
      email: "  andy@example.com  ",
      message: "  I need help with a production frontend migration.  ",
    });
    const invalid = contactActionInputSchema.safeParse({
      name: "",
      email: "not-an-email",
      message: "short",
      website: "x".repeat(201),
    });

    assert.deepEqual(parsed, {
      name: "Andy",
      email: "andy@example.com",
      message: "I need help with a production frontend migration.",
    });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      assert.deepEqual(
        invalid.error.issues.map((issue) => issue.path.join(".")).sort(),
        ["email", "message", "name", "website"],
      );
    }
  });

  it("detects trimmed honeypot content and silently accepts bot submissions", async () => {
    let sendCount = 0;

    assert.equal(isContactHoneypotFilled("   "), false);
    assert.equal(isContactHoneypotFilled(" https://spam.example "), true);

    const result = await handleContactAction(
      { ...validInput, website: "https://spam.example" },
      {
        clientAddress: "203.0.113.10",
        request: new Request("https://andyvi.dev/contacts"),
      },
      {
        checkRateLimit: () => ({ allowed: true, retryAfterMs: 0 }),
        isHoneypotFilled: isContactHoneypotFilled,
        sendEmail: async () => {
          sendCount += 1;
        },
      },
    );

    assert.equal(sendCount, 0);
    assert.deepEqual(result, { ok: true, status: "accepted" });
  });

  it("limits repeated contact attempts per normalized client identity", () => {
    const request = new Request("https://andyvi.dev/contacts", {
      headers: {
        "x-real-ip": "198.51.100.9",
        "x-forwarded-for": "203.0.113.99, 203.0.113.100",
      },
    });

    assert.deepEqual(
      checkContactRateLimit(
        { request },
        { maxAttempts: 2, windowMs: 1000, now: 100 },
      ),
      {
        allowed: true,
        remaining: 1,
        retryAfterMs: 0,
        resetAt: 1100,
      },
    );
    assert.equal(
      checkContactRateLimit(
        { request },
        { maxAttempts: 2, windowMs: 1000, now: 200 },
      ).allowed,
      true,
    );

    const blocked = checkContactRateLimit(
      { request },
      { maxAttempts: 2, windowMs: 1000, now: 300 },
    );
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.retryAfterMs, 800);

    assert.equal(
      checkContactRateLimit(
        { request },
        { maxAttempts: 2, windowMs: 1000, now: 1101 },
      ).allowed,
      true,
    );
  });

  it("throws the Astro action rate-limit envelope when policy is exceeded", () => {
    checkContactRateLimit("client-a", {
      maxAttempts: 1,
      windowMs: 1000,
      now: 100,
    });

    assert.throws(
      () =>
        assertContactRateLimit("client-a", {
          maxAttempts: 1,
          windowMs: 1000,
          now: 200,
        }),
      (error: unknown) =>
        error instanceof Error &&
        error.name === "ActionError" &&
        "code" in error &&
        error.code === "TOO_MANY_REQUESTS",
    );
  });
});
