const vanillaBeanSpellcheck = require('vanilla-bean-components/.spellcheck.cjs');
const { env, globals, parserOptions, plugins, rules, ignorePatterns, overrides, ...vanillaBeanEslint } = require('vanilla-bean-components/.eslintrc.cjs');
const localSpellcheck = require('./.spellcheck.cjs');

module.exports = {
	extends: vanillaBeanEslint.extends,
	env,
	globals,
	parserOptions,
	plugins,
	rules: {
		...rules,
		'spellcheck/spell-checker': [
			'warn',
			{
				...vanillaBeanSpellcheck,
				...localSpellcheck,
				skipWords: [...vanillaBeanSpellcheck.skipWords, ...localSpellcheck.skipWords],
			},
		],
	},
	ignorePatterns: [...ignorePatterns, 'client/build'],
	overrides: [
		...overrides,
		{
			files: ['server/*.js', 'server/**/*.js'],
			env: {
				browser: false,
				node: true,
			},
			globals: {
				Bun: true,
			},
			rules: {
				'no-console': 'off',
			},
		},
	],
};
