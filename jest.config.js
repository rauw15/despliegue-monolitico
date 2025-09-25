module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/database/migrate.js',
    '!src/database/seed.js',
    '!src/database/rollback.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true
};
