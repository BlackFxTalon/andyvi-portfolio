import nodemailer from 'nodemailer';

export interface ContactEmailInput {
  name: string;
  email: string;
  message: string;
}

interface ContactEmailEnv {
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  CONTACT_RECIPIENT?: string;
}

interface ContactEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  smtpUser: string;
  smtpPassword: string;
  recipient: string;
}

export interface ContactEmailMessage {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export interface ContactEmailTransport {
  sendMail(message: ContactEmailMessage): Promise<unknown>;
}

export class ContactEmailConfigError extends Error {
  constructor() {
    super('Contact email service is not configured.');
    this.name = 'ContactEmailConfigError';
  }
}

export class ContactEmailDeliveryError extends Error {
  constructor() {
    super('Contact email delivery failed.');
    this.name = 'ContactEmailDeliveryError';
  }
}

const DEFAULT_SMTP_HOST = 'smtp.timeweb.ru';
const DEFAULT_SMTP_PORT = 587;
const SMTP_TIMEOUT_MS = 10_000;

function required(value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new ContactEmailConfigError();
  }

  return trimmed;
}

function readEmailConfig(env: ContactEmailEnv = import.meta.env): ContactEmailConfig {
  const port = Number(env.SMTP_PORT ?? DEFAULT_SMTP_PORT);
  const normalizedPort = Number.isFinite(port) ? port : DEFAULT_SMTP_PORT;

  return {
    host: env.SMTP_HOST?.trim() || DEFAULT_SMTP_HOST,
    port: normalizedPort,
    secure: env.SMTP_SECURE === 'true' || normalizedPort === 465,
    smtpUser: required(env.SMTP_USER),
    smtpPassword: required(env.SMTP_PASSWORD),
    recipient: required(env.CONTACT_RECIPIENT),
  };
}

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export function createContactEmailTransport(
  env: ContactEmailEnv = import.meta.env,
): ContactEmailTransport {
  const config = readEmailConfig(env);

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  }) as ContactEmailTransport;
}

export function buildContactEmailMessage(
  input: ContactEmailInput,
  env: ContactEmailEnv = import.meta.env,
): ContactEmailMessage {
  const config = readEmailConfig(env);
  const name = sanitizeHeader(input.name);
  const email = sanitizeHeader(input.email);

  return {
    from: config.smtpUser,
    to: config.recipient,
    replyTo: email,
    subject: 'New AndyVi portfolio contact request',
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      input.message.trim(),
    ].join('\n'),
  };
}

export async function sendContactEmail(
  input: ContactEmailInput,
  options: {
    env?: ContactEmailEnv;
    transport?: ContactEmailTransport;
  } = {},
): Promise<void> {
  const env = options.env ?? import.meta.env;
  const transport = options.transport ?? createContactEmailTransport(env);
  const message = buildContactEmailMessage(input, env);

  try {
    await transport.sendMail(message);
  } catch {
    throw new ContactEmailDeliveryError();
  }
}
