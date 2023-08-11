/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    "^.+\\.spec.ts?$": [
      "ts-jest",
      {
        diagnostics: {
          exclude: ['**'],
        },
      },
    ],
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
};
