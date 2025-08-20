module.exports = {
  // Use ts-jest to handle TypeScript files
  preset: 'ts-jest',
  
  // Node.js environment (not browser)
  testEnvironment: 'node',
  
  // Where to find test files
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Include TypeScript files in coverage
  collectCoverageFrom: [
    '*.ts',
    '!*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  
  // Show detailed test results
  verbose: true
};