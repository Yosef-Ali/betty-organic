const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/supabase/tests/setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/supabase/tests/**/*.test.ts', '**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 10000, // Increased timeout for Supabase operations
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/supabase/**/*.ts',
    'app/auth/**/*.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globalSetup: '<rootDir>/supabase/tests/globalSetup.js',
};

module.exports = createJestConfig(customJestConfig);
