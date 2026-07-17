import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // This rule flags any setState call written directly in a useEffect
      // body, including the standard "fetch on mount" idiom
      // (useEffect(() => { load() }, [load])) that this codebase uses
      // throughout for data loading. That idiom is explicitly sanctioned by
      // the React docs, so treating it as an error produces false positives
      // on nearly every data-driven page rather than catching real bugs.
      "react-hooks/set-state-in-effect": "off",
    },
  },
])
