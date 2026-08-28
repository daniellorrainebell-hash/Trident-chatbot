// Flat config. `eslint-config-expo` carries the React, React Hooks, import and
// TypeScript rules that match this SDK.
//
// Two of its defaults are turned off below. Both are correct for React on the
// web and wrong here: this app renders to native views, not HTML.
const expo = require('eslint-config-expo/flat');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  ...expo,
  {
    ignores: ['dist/**', 'node_modules/**', '.expo/**', 'coverage/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // An unused import is usually a leftover from a refactor that moved the
      // logic elsewhere — worth seeing.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // A stale closure in a hook is the failure mode this app is most exposed
      // to: the camera fires faster than React re-renders.
      'react-hooks/exhaustive-deps': 'warn',

      // `<Text>don't</Text>` renders an apostrophe on native. Writing &apos;
      // there would render the six literal characters instead, so obeying this
      // rule would introduce the bug it exists to prevent.
      'react/no-unescaped-entities': 'off',
      // Array<T> vs T[] is a formatting preference with no failure mode.
      '@typescript-eslint/array-type': 'off',
    },
  },
];
