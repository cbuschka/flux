module.exports = {
  clearMocks: true,
  globals: { __JEST__: true },
  moduleDirectories: [
    "node_modules"
  ],
  moduleFileExtensions: [
    "js",
  ],

  roots: [
    './src',
  ],

  testEnvironment: "node",

  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],

  testPathIgnorePatterns: [
    "/node_modules/"
  ],
};
