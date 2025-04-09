/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only transform files within our project source folders (e.g., src and tests)
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  // Ignore directories that are not part of our project
  modulePathIgnorePatterns: [
    "<rootDir>/.vscode/",
    "<rootDir>/.cargo/",
    "<rootDir>/node_modules/"
  ],
  // If you need to transform some node_modules, you can adjust transformIgnorePatterns;
  // By default, node_modules is ignored.
  transformIgnorePatterns: ["/node_modules/"],
};
