/**
 * The deterministic engines are plain TypeScript with no React Native imports,
 * so they run under ts-jest in a node environment — fast, and no native mocking.
 * Component tests would need jest-expo; that is deliberately out of scope here.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/engines/**/*.ts', '!src/engines/**/index.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
