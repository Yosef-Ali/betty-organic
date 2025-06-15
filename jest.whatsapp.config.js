const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/whatsapp/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  // No global setup needed for WhatsApp tests
  setupFilesAfterEnv: [],
};

module.exports = createJestConfig(customJestConfig);