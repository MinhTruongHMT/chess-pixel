import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.npm-cache/**', '.browser-cache/**', 'public/assets/engine/**', '.qa/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': hooks },
    rules: hooks.configs.recommended.rules,
  },
  { files: ['*.js', '*.ts', 'scripts/**/*.mjs'], languageOptions: { globals: globals.node } },
);
