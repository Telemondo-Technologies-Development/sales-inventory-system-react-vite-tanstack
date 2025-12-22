// Minimal test setup for Vitest + jsdom
// Provide a basic react-act environment flag and any necessary globals
// Avoid importing jest-dom to keep deps minimal.

// Ensure React testing utils know we're in an act environment
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// Polyfill window.matchMedia used by some components (simple noop)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
