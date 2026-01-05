/**
 * TypeDoc Configuration
 *
 * Generates API documentation from TypeScript comments.
 *
 * Usage:
 *   npm run docs:api         # Generate HTML docs
 *   npm run docs:api:json    # Generate JSON docs
 */

export default {
  // Input
  entryPoints: ['./src/**/*.ts', './src/**/*.tsx'],
  // Exclude test files
  exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/node_modules/**'],

  // Output
  out: './docs/api-reference',

  // Project
  name: 'Haldeki API Documentation',

  // Theme
  theme: 'default',
  hideGenerator: true,

  // Entry point strategy
  entryPointStrategy: 'expand',

  // Categories
  categoryOrder: ['Components*', 'Hooks*', 'Lib*', 'Utils*', 'Types*', 'Pages*', '*'],
  defaultCategory: 'Other',

  // Formatting
  sort: ['source-order'],

  // Comments
  includeVersion: true,
  excludePrivate: true,
  excludeProtected: false,
  excludeInternal: true,

  // TypeScript
  tsconfig: './tsconfig.app.json',

  // Search
  searchInComments: true,
  searchInDocuments: true,

  // Options for better docs
  logLevel: 'Info'
};
