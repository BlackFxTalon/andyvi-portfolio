import { registerHooks } from "node:module";

export interface AstroActionsMock {
  actions?: {
    contact?: {
      send?: (formData: FormData) => Promise<unknown> | unknown;
    };
  };
  isInputError?: (value: unknown) => boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __astroActionsMock: AstroActionsMock | undefined;
}

let hooksRegistered = false;

export function installAstroActionsMock(): void {
  if (hooksRegistered) return;

  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "astro:actions") {
        return {
          url: "astro-actions:mock",
          format: "module",
          shortCircuit: true,
        };
      }

      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === "astro-actions:mock") {
        return {
          format: "module",
          shortCircuit: true,
          source: `
            const currentMock = () => globalThis.__astroActionsMock ?? {};
            export const actions = new Proxy({}, {
              get(_target, property) {
                return currentMock().actions?.[property];
              }
            });
            export function isInputError(value) {
              return Boolean(currentMock().isInputError?.(value));
            }
            export class ActionError extends Error {
              constructor(options = {}) {
                super(options.message ?? "Action error");
                this.name = "ActionError";
                this.code = options.code;
              }
            }
            export function defineAction(config) {
              return config;
            }
          `,
        };
      }

      return nextLoad(url, context);
    },
  });

  hooksRegistered = true;
}

export function setAstroActionsMock(mock: AstroActionsMock): void {
  globalThis.__astroActionsMock = mock;
}

export function clearAstroActionsMock(): void {
  globalThis.__astroActionsMock = undefined;
}
