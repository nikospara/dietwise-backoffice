import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import importX from 'eslint-plugin-import-x';
import stylistic from '@stylistic/eslint-plugin';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
				window: 'readonly',
				document: 'readonly',
				console: 'writable',
			},

			parser: tsParser,
			ecmaVersion: 2021,
			sourceType: 'module',

			parserOptions: {
				ecmaFeatures: {
					// Enable JSX parsing
					jsx: true,
				},
				// no-leaked-conditional-rendering needs the type of the left-hand operand
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},

		plugins: {
			'@eslint-react': eslintReact,
			'@stylistic': stylistic,
		},

		extends: [
			tsPlugin.configs['flat/recommended'],
			reactHooks.configs.flat.recommended,
			importX.flatConfigs.recommended,
			importX.flatConfigs.typescript,
			// Make prettier as the last item in the extends array, so that it has the opportunity to override other configs
			prettierRecommended,
		],

		settings: {
			'import-x/parsers': {
				'@typescript-eslint/parser': ['.ts', '.tsx'],
			},

			'import-x/resolver': {
				typescript: true,
				node: true,
			},
		},

		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'@stylistic/jsx-curly-brace-presence': 'warn',
			'@eslint-react/no-leaked-conditional-rendering': 'warn',
			'@eslint-react/no-nested-component-definitions': 'warn',
			quotes: ['warn', 'single'],
			'arrow-body-style': 'off',
			'prefer-arrow-callback': 'off',
			'prettier/prettier': 'warn',
			'react-hooks/exhaustive-deps': 'warn',

			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					fixStyle: 'separate-type-imports',
				},
			],
		},
	},
	globalIgnores([
		'**/node_modules',
		'scripts/*',
		'config/*',
		'**/pnpm-lock.yaml',
		'**/pnpm-workspace.yaml',
		'**/.DS_Store',
		'**/package.json',
		'**/tsconfig.json',
		'**/*.md',
		'**/build',
		'**/dist',
		'**/eslint.config.js',
		'**/.*',
	]),
]);
