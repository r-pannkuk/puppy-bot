import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        /**
         * Run `tests/setup.ts` before every test file.
         * This provides environment variable defaults and the Prisma client
         * instance on `container.database` (used by integration tests).
         */
        setupFiles: ['tests/setup.ts'],

        /**
         * Generous timeout for tests that hit a real MongoDB instance.
         * Unit tests finish in milliseconds; this headroom is for integration.
         */
        testTimeout: 15_000,
        hookTimeout: 15_000,

        /**
         * Coverage via V8 – zero extra dependencies needed.
         * Run with: npm run test:coverage
         */
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'src/deleteCommands.ts', 'src/importOldSchema.ts'],
            reporter: ['text', 'lcov'],
        },
    },
});
