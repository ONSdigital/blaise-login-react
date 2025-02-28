module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(axios|blaise-api-node-client)/)"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
  ],
  testMatch: [
    "**/src/**/*.test.(ts|tsx|js|jsx)",
  ],
  modulePathIgnorePatterns: [
    "node_modules",
    "build",
    "dist",
    "lib",
  ],
};