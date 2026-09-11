import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: { include: ['tests/unit/**/*.test.ts'], reporters: ['default', 'json'], outputFile: process.env.FSC_UNIT_REPORT || '.fsc-test/unit.json', restoreMocks: true },
});
