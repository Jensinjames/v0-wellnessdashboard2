module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json",
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "next/core-web-vitals",
    "prettier", // Make sure this is last to override other configs
  ],
  plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y", "import", "prettier"],
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      typescript: {},
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  rules: {
    // Strict TypeScript rules to catch syntax errors
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/restrict-template-expressions": "warn",
    "@typescript-eslint/unbound-method": "warn",
    "@typescript-eslint/prefer-as-const": "error",
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": "allow-with-description",
        "ts-nocheck": "allow-with-description",
        "ts-check": false,
      },
    ],

    // React specific rules
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/prop-types": "off", // We're using TypeScript for prop validation
    "react/react-in-jsx-scope": "off", // Not needed in Next.js

    // JSX-specific rules to catch syntax issues
    "react/jsx-no-undef": "error",
    "react/jsx-uses-vars": "error",
    "react/jsx-uses-react": "error",
    "react/jsx-closing-bracket-location": ["error", "line-aligned"],
    "react/jsx-closing-tag-location": "error",
    "react/jsx-tag-spacing": [
      "error",
      {
        closingSlash: "never",
        beforeSelfClosing: "always",
        afterOpening: "never",
        beforeClosing: "never",
      },
    ],
    "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
    "react/jsx-curly-spacing": ["error", { when: "never", children: true }],
    "react/jsx-equals-spacing": ["error", "never"],
    "react/jsx-first-prop-new-line": ["error", "multiline"],
    "react/jsx-max-props-per-line": ["error", { maximum: 1, when: "multiline" }],
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-pascal-case": "error",
    "react/jsx-props-no-multi-spaces": "error",
    "react/jsx-wrap-multilines": [
      "error",
      {
        declaration: "parens-new-line",
        assignment: "parens-new-line",
        return: "parens-new-line",
        arrow: "parens-new-line",
        condition: "parens-new-line",
        logical: "parens-new-line",
        prop: "parens-new-line",
      },
    ],
    "react/no-danger": "warn",
    "react/no-deprecated": "error",
    "react/no-direct-mutation-state": "error",
    "react/no-typos": "error",
    "react/no-unknown-property": "error",
    "react/self-closing-comp": "error",
    "react/style-prop-object": "error",
    "react/void-dom-elements-no-children": "error",

    // TypeScript in JSX specific rules
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "allow",
      },
    ],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "typeParameter",
        format: ["PascalCase"],
        prefix: ["T"],
      },
    ],

    // Import rules
    "import/no-unresolved": "error",
    "import/named": "error",
    "import/default": "error",
    "import/namespace": "error",
    "import/order": [
      "error",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],

    // General code quality rules
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "warn",
    "no-alert": "warn",
    "no-unused-vars": "off", // Using TypeScript's version
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "prettier/prettier": ["error", {}, { usePrettierrc: true }],
  },
  overrides: [
    // Specific rules for Next.js pages and API routes
    {
      files: ["pages/**/*.tsx", "pages/**/*.ts", "app/**/*.tsx", "app/**/*.ts"],
      rules: {
        "import/no-default-export": "off",
      },
    },
    // Special rules for TypeScript in JSX files
    {
      files: ["**/*.tsx"],
      rules: {
        // These rules help catch issues with TypeScript generics in JSX
        "@typescript-eslint/type-annotation-spacing": [
          "error",
          {
            before: true,
            after: true,
            overrides: {
              colon: {
                before: false,
                after: true,
              },
              arrow: {
                before: true,
                after: true,
              },
            },
          },
        ],
        "no-unexpected-multiline": "error",
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },
  ],
}
