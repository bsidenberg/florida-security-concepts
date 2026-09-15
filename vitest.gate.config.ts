import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
// '@' alias mirrors vitest.config.ts so gate suites can import the real route/provider modules.
export default defineConfig({ resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } }, test: { include: ['tests/gate/**/*.test.ts'], reporters: ['default', 'json'], outputFile: process.env.FSC_GATE_REPORT || '.fsc-test/gate.json', testTimeout: 60000 } });
