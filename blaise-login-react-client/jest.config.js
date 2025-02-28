module.exports = {
    "setupFilesAfterEnv": [
        "<rootDir>/src/setupTests.ts"
    ],
    "testEnvironment": "jsdom",
    modulePathIgnorePatterns: ["node_modules", "build"]
};