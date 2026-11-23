import js from '@eslint/js'
import globals from 'globals'
import tsparser from '@typescript-eslint/parser'
import tseslint from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const hooksRecommended =
  reactHooks.configs.recommended?.rules
    ? reactHooks.configs.recommended
    : reactHooks.configs['recommended-latest']

// ESLint 9/10 REMOVED these from eslint:recommended. Parity measured 91 -> 103 with them missing.
// Listed explicitly so the migration is not a quiet relaxation - prefer-const is a real signal.
const droppedFromRecommended = {
  'no-extra-semi': 'error',
  'no-inner-declarations': 'error',
  'no-mixed-spaces-and-tabs': 'error',
  'no-new-symbol': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
}

export default [
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results', '__mocks__'] },
  {
    // Scoped to exactly what the old gate linted: `eslint . --ext ts,tsx`.
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...hooksRecommended.rules,
      ...droppedFromRecommended,
      // TypeScript already checks undefined identifiers, and the legacy config had this off via
      // tseslint's eslint-recommended override. Setting it explicitly restores that behaviour
      // rather than relaxing anything - the old gate never ran this rule on a .ts/.tsx file.
      'no-undef': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]
