import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  clearAstroActionsMock,
  installAstroActionsMock,
  setAstroActionsMock,
} from "../helpers/astroActionsMock.ts";
import {
  createDom,
  flushMicrotasks,
  type DomFixture,
} from "../helpers/dom.ts";

installAstroActionsMock();

const { bindContactForm } = await import("../../src/scripts/contactForm.ts");

let fixture: DomFixture | undefined;

function setupContactForm(): DomFixture {
  fixture = createDom(`
    <form data-contact-form action="/_actions/contact.send" method="POST" data-state="idle">
      <div id="contact-form-status" data-contact-status hidden tabindex="-1"></div>
      <div data-field="name">
        <input id="contact-name" name="name" required aria-invalid="false" />
        <p data-field-error="name" hidden></p>
      </div>
      <div data-field="email">
        <input id="contact-email" name="email" type="email" required aria-invalid="false" />
        <p data-field-error="email" hidden></p>
      </div>
      <div data-field="message">
        <textarea id="contact-message" name="message" required minlength="10" aria-invalid="false"></textarea>
        <p data-field-error="message" hidden></p>
      </div>
      <input id="contact-website" name="website" tabindex="-1" autocomplete="off" />
      <button type="submit" data-submit-button data-idle-label="Send" data-loading-label="Sending">
        <span data-submit-label>Send</span>
      </button>
    </form>
  `);
  return fixture;
}

function fillValidForm(document: Document): void {
  (document.getElementById("contact-name") as HTMLInputElement).value = "Andy";
  (document.getElementById("contact-email") as HTMLInputElement).value =
    "andy@example.com";
  (document.getElementById("contact-message") as HTMLTextAreaElement).value =
    "I need help with a production frontend migration.";
}

function submit(form: HTMLFormElement, window: Window): boolean {
  return form.dispatchEvent(
    new window.Event("submit", { bubbles: true, cancelable: true }),
  );
}

afterEach(() => {
  clearAstroActionsMock();
  fixture?.cleanup();
  fixture = undefined;
});

describe("contact form progressive enhancement", () => {
  it("lets native validation handle invalid forms without calling the action", () => {
    const { document, window } = setupContactForm();
    const form = document.querySelector("[data-contact-form]") as HTMLFormElement;
    let sendCount = 0;

    form.reportValidity = () => false;
    setAstroActionsMock({
      actions: {
        contact: {
          send: () => {
            sendCount += 1;
            return { data: { ok: true, status: "accepted" }, error: undefined };
          },
        },
      },
      isInputError: () => false,
    });

    bindContactForm(document);

    assert.equal(submit(form, window), true);
    assert.equal(sendCount, 0);
    assert.equal(form.dataset.state, "idle");
  });

  it("prevents double submit, shows pending state, and resets after success", async () => {
    const { document, window } = setupContactForm();
    const form = document.querySelector("[data-contact-form]") as HTMLFormElement;
    const button = document.querySelector("[data-submit-button]") as HTMLButtonElement;
    const label = document.querySelector("[data-submit-label]") as HTMLElement;
    const status = document.querySelector("[data-contact-status]") as HTMLElement;
    let sendCount = 0;
    let resolveAction:
      | ((value: { data: { ok: true; status: "accepted" }; error: undefined }) => void)
      | undefined;

    fillValidForm(document);
    form.reportValidity = () => true;
    setAstroActionsMock({
      actions: {
        contact: {
          send: () => {
            sendCount += 1;
            return new Promise((resolve) => {
              resolveAction = resolve;
            });
          },
        },
      },
      isInputError: () => false,
    });

    bindContactForm(document);

    assert.equal(submit(form, window), false);
    assert.equal(button.disabled, true);
    assert.equal(label.textContent, "Sending");
    assert.equal(form.getAttribute("aria-busy"), "true");

    assert.equal(submit(form, window), false);
    assert.equal(sendCount, 1);

    resolveAction?.({ data: { ok: true, status: "accepted" }, error: undefined });
    await flushMicrotasks();

    assert.equal(button.disabled, false);
    assert.equal(label.textContent, "Send");
    assert.equal(form.getAttribute("aria-busy"), "false");
    assert.equal(status.hidden, false);
    assert.equal(status.classList.contains("is-success"), true);
    assert.equal((document.getElementById("contact-name") as HTMLInputElement).value, "");
  });

  it("renders server input errors and clears a field error on input", async () => {
    const { document, window } = setupContactForm();
    const form = document.querySelector("[data-contact-form]") as HTMLFormElement;
    const name = document.getElementById("contact-name") as HTMLInputElement;
    const nameError = document.querySelector(
      "[data-field-error='name']",
    ) as HTMLElement;
    const status = document.querySelector("[data-contact-status]") as HTMLElement;

    fillValidForm(document);
    form.reportValidity = () => true;
    setAstroActionsMock({
      actions: {
        contact: {
          send: () => ({
            data: undefined,
            error: {
              kind: "input",
              fields: {
                name: ["Name is required."],
                email: ["Enter a valid email address."],
              },
            },
          }),
        },
      },
      isInputError: (value) =>
        typeof value === "object" &&
        value !== null &&
        "kind" in value &&
        value.kind === "input",
    });

    bindContactForm(document);
    submit(form, window);
    await flushMicrotasks();

    assert.equal(name.getAttribute("aria-invalid"), "true");
    assert.equal(nameError.hidden, false);
    assert.equal(nameError.textContent, "Name is required.");
    assert.equal(status.getAttribute("role"), "alert");
    assert.equal(status.classList.contains("is-error"), true);
    assert.equal(document.activeElement, status);

    name.value = "Andy";
    name.dispatchEvent(new window.Event("input", { bubbles: true }));

    assert.equal(name.getAttribute("aria-invalid"), "false");
    assert.equal(nameError.hidden, true);
    assert.equal(nameError.textContent, "");
  });
});
