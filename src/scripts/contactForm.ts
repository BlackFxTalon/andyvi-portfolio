import { actions, isInputError } from "astro:actions";

type ContactFieldName = "name" | "email" | "message";

const FIELD_NAMES = ["name", "email", "message"] as const satisfies readonly ContactFieldName[];

let contactFormController: AbortController | undefined;
let isSubmitting = false;

function getField(form: HTMLFormElement, name: ContactFieldName): HTMLInputElement | HTMLTextAreaElement | null {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? field : null;
}

function getFieldShell(form: HTMLFormElement, name: ContactFieldName): HTMLElement | null {
  return form.querySelector<HTMLElement>(`[data-field="${name}"]`);
}

function getFieldError(form: HTMLFormElement, name: ContactFieldName): HTMLElement | null {
  return form.querySelector<HTMLElement>(`[data-field-error="${name}"]`);
}

function setStatus(form: HTMLFormElement, message: string, kind: "idle" | "success" | "error"): void {
  const status = form.querySelector<HTMLElement>("[data-contact-status]");
  if (!status) return;

  status.textContent = message;
  status.hidden = message.length === 0;
  status.classList.toggle("is-success", kind === "success");
  status.classList.toggle("is-error", kind === "error");
  status.setAttribute("role", kind === "error" ? "alert" : "status");
  status.setAttribute("aria-live", kind === "error" ? "assertive" : "polite");
  form.dataset.state = kind;

  if (kind === "error") {
    status.focus({ preventScroll: false });
  }
}

function setSubmitting(form: HTMLFormElement, submitting: boolean): void {
  isSubmitting = submitting;
  form.setAttribute("aria-busy", String(submitting));
  form.dataset.state = submitting ? "submitting" : form.dataset.state ?? "idle";

  const button = form.querySelector<HTMLButtonElement>("[data-submit-button]");
  const label = form.querySelector<HTMLElement>("[data-submit-label]");
  if (!button || !label) return;

  button.disabled = submitting;
  label.textContent = submitting
    ? button.dataset.loadingLabel || "Отправка..."
    : button.dataset.idleLabel || "Отправить сообщение";
}

function clearFieldErrors(form: HTMLFormElement): void {
  FIELD_NAMES.forEach((name) => {
    const field = getField(form, name);
    const shell = getFieldShell(form, name);
    const error = getFieldError(form, name);

    field?.setAttribute("aria-invalid", "false");
    shell?.classList.remove("is-error");
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  });
}

function setFieldErrors(form: HTMLFormElement, fields: Partial<Record<ContactFieldName, string[]>>): void {
  let firstInvalidField: HTMLInputElement | HTMLTextAreaElement | undefined;

  FIELD_NAMES.forEach((name) => {
    const messages = fields[name] ?? [];
    const field = getField(form, name);
    const shell = getFieldShell(form, name);
    const error = getFieldError(form, name);
    const hasError = messages.length > 0;

    field?.setAttribute("aria-invalid", String(hasError));
    shell?.classList.toggle("is-error", hasError);
    if (error) {
      error.textContent = messages[0] ?? "";
      error.hidden = !hasError;
    }
    if (hasError && field && firstInvalidField === undefined) {
      firstInvalidField = field;
    }
  });

  if (firstInvalidField) {
    firstInvalidField.focus({ preventScroll: false });
  }
}

function normalizeInputErrors(fields: Record<string, string[] | undefined>): Partial<Record<ContactFieldName, string[]>> {
  return FIELD_NAMES.reduce<Partial<Record<ContactFieldName, string[]>>>((normalized, name) => {
    const messages = fields[name];
    if (messages?.length) {
      normalized[name] = messages;
    }
    return normalized;
  }, {});
}

export function bindContactForm(root: ParentNode = document): void {
  contactFormController?.abort();
  contactFormController = undefined;

  const form = root.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;

  contactFormController = new AbortController();
  const { signal } = contactFormController;

  FIELD_NAMES.forEach((name) => {
    const field = getField(form, name);
    field?.addEventListener(
      "input",
      () => {
        const shell = getFieldShell(form, name);
        const error = getFieldError(form, name);
        field.setAttribute("aria-invalid", "false");
        shell?.classList.remove("is-error");
        if (error) {
          error.textContent = "";
          error.hidden = true;
        }
      },
      { signal },
    );
  });

  form.addEventListener(
    "submit",
    async (event) => {
      if (isSubmitting) {
        event.preventDefault();
        return;
      }

      if (!form.reportValidity()) {
        return;
      }

      event.preventDefault();
      clearFieldErrors(form);
      setStatus(form, "Отправляем сообщение...", "idle");
      setSubmitting(form, true);

      try {
        const formData = new FormData(form);
        const { data, error } = await actions.contact.send(formData);

        if (isInputError(error)) {
          setFieldErrors(form, normalizeInputErrors(error.fields));
          setStatus(form, "Проверьте выделенные поля и отправьте сообщение еще раз.", "error");
          return;
        }

        if (error || data?.ok === false) {
          const message =
            data?.ok === false
              ? data.error.message
              : "Сообщение не удалось отправить сейчас. Попробуйте позже или напишите напрямую.";
          setStatus(form, message, "error");
          return;
        }

        form.reset();
        clearFieldErrors(form);
        setStatus(
          form,
          "Сообщение отправлено. Спасибо, я отвечу в ближайшее рабочее время.",
          "success",
        );
      } catch {
        setStatus(
          form,
          "Сообщение не удалось отправить сейчас. Попробуйте позже или напишите напрямую.",
          "error",
        );
      } finally {
        setSubmitting(form, false);
      }
    },
    { signal },
  );
}
