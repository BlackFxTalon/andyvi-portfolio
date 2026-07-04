import type { ActionAPIContext } from 'astro:actions';
import { defineAction } from 'astro:actions';
import { sendContactEmail } from '@/server/email';
import {
  checkContactRateLimit,
  isContactHoneypotFilled,
} from '@/server/rateLimit';
import { contactActionInputSchema, handleContactAction } from './contactCore';

export * from './contactCore';

function runContactAction(input: Parameters<typeof handleContactAction>[0], context: ActionAPIContext) {
  return handleContactAction(
    input,
    {
      clientAddress: context.clientAddress,
      request: context.request,
    },
    {
      checkRateLimit: checkContactRateLimit,
      isHoneypotFilled: isContactHoneypotFilled,
      sendEmail: sendContactEmail,
    },
  );
}

export const contact = {
  send: defineAction({
    accept: 'form',
    input: contactActionInputSchema,
    handler: runContactAction,
  }),
};
