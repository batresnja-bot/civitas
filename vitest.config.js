import { defineConfig } from 'vitest/config';

// Root config covers the Node/Express API tests. The SPA client has its own
// vitest config under client/ (jsdom environment).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/**/*.test.mjs'],
  },
});
