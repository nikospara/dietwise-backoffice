/* eslint-disable @typescript-eslint/no-require-imports */
const { defineConfig, globalIgnores } = require('eslint/config');

const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');

const { fixupConfigRules } = require('@eslint/compat');

const js = require('@eslint/js');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

module.exports = defineConfig([
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
			},
		},

		extends: fixupConfigRules(
			compat.extends(
				'plugin:@typescript-eslint/recommended',
				'plugin:react/jsx-runtime',
				'plugin:react-hooks/recommended',
				'plugin:import-x/recommended',
				'plugin:import-x/typescript',
				// Make prettier as the last item in the extends array, so that it has the opportunity to override other configs
				'plugin:prettier/recommended',
			),
		),

		settings: {
			react: {
				version: 'detect',
			},

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
			'react/jsx-curly-brace-presence': 'warn',
			'react/jsx-no-leaked-render': 'warn',
			quotes: ['warn', 'single'],
			'arrow-body-style': 'off',
			'prefer-arrow-callback': 'off',
			'prettier/prettier': 'warn',
			'react-hooks/exhaustive-deps': 'warn',

			'react/no-unstable-nested-components': [
				'warn',
				{
					allowAsProps: true,
				},
			],

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
		'**/.eslintrc.cjs',
		'**/eslint.config.js',
		'**/.*',
	]),
]);
