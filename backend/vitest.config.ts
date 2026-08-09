import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // `dist/` holds the CommonJS build; running its compiled test copies fails
    // because Vitest cannot be required from CJS.
    exclude: ['node_modules/**', 'dist/**'],
  },
});
