import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  // Build output is minified and not ours to lint.
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // eslint-plugin-react-hooks 7 ships a flat config that registers the plugin
  // and enables the React Compiler rules (set-state-in-effect, refs, purity, ...).
  reactHooks.configs.flat.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Existing effects reset state when the user changes; downgraded to a
      // warning (same tier as exhaustive-deps) until they are refactored.
      'react-hooks/set-state-in-effect': 'warn',
    },
  }
)
