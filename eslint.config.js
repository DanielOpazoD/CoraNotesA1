import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: ['node_modules', 'coverage', 'cypress/videos', 'cypress/screenshots']
  },
  js.configs.recommended,
  importPlugin.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        HTMLElement: 'readonly',
        Node: 'readonly',
        cy: 'readonly'
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ]
    }
  }
];
