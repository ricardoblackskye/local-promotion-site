/* #17: the repo's `lint` script (eslint . --ext ts,tsx --report-unused-disable-directives
 * --max-warnings 0) had no configuration to resolve, so the gate failed on every machine.
 *
 * This uses ONLY packages the manifest already declares:
 *   eslint ^8.57.0, @typescript-eslint/{parser,eslint-plugin} ^7.2.0,
 *   eslint-plugin-react-hooks ^4.6.0, eslint-plugin-react-refresh ^0.4.6
 *
 * Legacy config rather than a flat `eslint.config.js`: it fits the eslint 8.57 the manifest pins and
 * adds no dependency. A flat config importing `typescript-eslint` fails ERR_MODULE_NOT_FOUND - that
 * package is not declared.
 *
 * `__mocks__` is test fixture code rather than shipped UI, so it is ignored here instead of relaxing
 * react-refresh/only-export-components, which is a real fast-refresh guard where it matters.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  ignorePatterns: ['dist', 'node_modules', 'playwright-report', 'test-results', '__mocks__'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
};
