module.exports = {
	env: {
		browser: true,
		es2022: true,
		node: true,
		'vitest-globals/env': true,
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
	},
	extends: ['eslint:recommended', 'plugin:prettier/recommended', 'plugin:vitest-globals/recommended'],
	plugins: ['vitest'],
	rules: {
		'no-async-promise-executor': 'off',
	},
};
