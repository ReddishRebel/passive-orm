import globals from 'globals';
import pluginJs from '@eslint/js';
import sortImportRequires from 'eslint-plugin-sort-imports-requires';

export default [
  {
    plugins: {
      pluginJs,
      'sort-imports-requires': sortImportRequires
    },
    rules: {
      'sort-imports-requires/sort-imports': ['error', { unsafeAutofix: true }],
      'sort-imports-requires/sort-requires': ['error', { unsafeAutofix: true }]
    }
  },
  { files: ['src/**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  { languageOptions: { globals: globals.node } },
  {
    rules: {
      'no-console': 'error',
      'sort-imports': 'error'
    }
  }
];
