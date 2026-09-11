import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/gate/**/*.test.ts'], reporters: ['default', 'json'], outputFile: process.env.FSC_GATE_REPORT || '.fsc-test/gate.json', testTimeout: 60000 } });
