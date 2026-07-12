import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const importOrderRules = {
  'import/no-duplicates': 'error',
  'import/order': [
    'error',
    {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'object',
        'type',
      ],
      pathGroups: [
        {
          pattern: '@{app,features,shared,content}{,/**}',
          group: 'internal',
          position: 'before',
        },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      alphabetize: { order: 'asc', caseInsensitive: true },
      'newlines-between': 'always',
    },
  ],
}

export default defineConfig([
  {
    ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
    rules: {
      ...importOrderRules,
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@features/*/ui/*', '@features/*/model/*'],
              message: 'Import feature modules via @features/<feature> public API.',
            },
            {
              group: ['@content/data/*', '@content/loaders/*', '@content/schemas/*'],
              message:
                'Import content only via @content barrel — never reach into data/, loaders/, or schemas/ directly.',
            },
          ],
        },
      ],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/shared',
              from: './src/app',
              message: 'Shared layer must not depend on app.',
            },
            {
              target: './src/shared',
              from: './src/features',
              message: 'Shared layer must not depend on features.',
            },
            {
              target: './src/shared',
              from: './src/content',
              message: 'Shared layer must not depend on content.',
            },
            {
              target: './src/features',
              from: './src/app',
              message: 'Feature layer must not depend on app.',
            },
            {
              target: './src/features',
              from: './src/content',
              message: 'Feature layer must not depend on content.',
            },
            {
              target: './src/content',
              from: './src/app',
              message: 'Content layer must not depend on app.',
            },
            {
              target: './src/content',
              from: './src/features',
              message: 'Content layer must not depend on features.',
            },
          ],
        },
      ],
      'import/no-default-export': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['*.config.ts', 'config/**/*.ts', 'e2e/**/*.ts', 'playwright.config.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
    rules: {
      ...importOrderRules,
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['eslint.config.js', 'scripts/**/*.js'],
    extends: [js.configs.recommended, importPlugin.flatConfigs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      ...importOrderRules,
      'import/no-default-export': 'off',
      'import/no-named-as-default': 'off',
      'import/no-unresolved': [
        'error',
        { ignore: ['^eslint/config$', '^typescript-eslint$'] },
      ],
    },
  },
])
