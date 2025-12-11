// Svelte 5 TypeScript declarations
declare namespace svelteHTML {
  // This namespace is used by Svelte's TypeScript integration
  // to provide type safety for HTML elements in templates
  interface IntrinsicElements {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [elemName: string]: any;
  }
}
