const vanillaBeanSpellcheck = require('vanilla-bean-components/.spellcheck.cjs');
const localSpellcheck = require('./.spellcheck.cjs');

module.exports = {
	extends: ['./node_modules/vanilla-bean-components/.eslintrc.cjs'],
	rules: {
		'spellcheck/spell-checker': [
			'warn',
			{
				...vanillaBeanSpellcheck,
				...localSpellcheck,
				skipWords: [...vanillaBeanSpellcheck.skipWords, ...localSpellcheck.skipWords],
			},
		],
	},
	overrides: [
		{
			files: ['server/*.js', 'server/**/*.js'],
			env: {
				browser: false,
				node: true,
			},
			rules: {
				'no-console': 'off',
			},
		},
	],
};
