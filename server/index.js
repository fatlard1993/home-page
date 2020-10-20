#!/usr/bin/env node

const yargs = require('yargs');
const rootFolder = require('find-root')(__dirname);

process.chdir(rootFolder);

yargs.alias({
	h: 'help',
	v: 'verbosity',
	p: 'port'
});

yargs.boolean(['h', 'ver', 's']);

yargs.default({
	v: 1,
	p: 80
});

yargs.describe({
	v: '<level>',
	p: '<port>'
});

const args = yargs.argv;

['_', '$0', 'v', 'p'].forEach((item) => { delete args[item]; });

const opts = Object.assign(args, { args: Object.assign({}, args), rootFolder, verbosity: Number(args.verbosity) });

const log = new (require('log'))({ tag: 'home-page', color: true, verbosity: opts.verbosity });

log(1)('Options', opts);

require('./homePage').init(opts);