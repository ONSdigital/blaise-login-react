// babel.config.js
// Consolidated configuration to remove redundancy and deprecated plugins
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        // preset-env automatically includes class properties transformation
        // based on your targets.
        "targets": {
          "node": "current" // Or your specific browser list
        }
      }
    ],
    [
      "@babel/preset-react",
      {
        "runtime": "automatic" // Moved from .babelrc
      }
    ],
    "@babel/preset-typescript",
  ],
  plugins: [
    "@babel/plugin-transform-runtime", // Standard for reducing code duplication
  ],
};