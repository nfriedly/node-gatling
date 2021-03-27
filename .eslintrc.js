"use strict";

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:node/recommended",
  ],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    "no-var": "error",
    "prefer-const": "error",
    strict: "error",
  },
  overrides: [
    {
      files: ["test/*"],
      env: {
        mocha: true,
      },
    },
  ],
};
