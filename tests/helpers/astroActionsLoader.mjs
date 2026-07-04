const moduleSource = `
const defaultMock = {
  async send() {
    return { data: { ok: true, status: "accepted" }, error: undefined };
  },
};

function getMock() {
  return globalThis.__andyviContactActionMock ?? defaultMock;
}

export const actions = {
  contact: {
    send(formData) {
      return getMock().send(formData);
    },
  },
};

export function isInputError(error) {
  return Boolean(error && error.__isInputError === true && error.fields);
}
`;

export function resolve(specifier, context, nextResolve) {
  if (specifier === "astro:actions") {
    return {
      shortCircuit: true,
      url: `data:text/javascript,${encodeURIComponent(moduleSource)}`,
    };
  }

  return nextResolve(specifier, context);
}
