#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const yargs = require('yargs');
const rootFolder = require('find-root')(__dirname);

function rootPath(){ return path.join(rootFolder, ...arguments); }

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

var opts = yargs.argv;

opts.rootFolder = rootFolder;

delete opts._;
delete opts.$0;
delete opts.v;
delete opts.p;

opts.verbosity = Number(opts.verbosity);

//log args polyfill
process.env.DBG = opts.verbosity;
process.env.COLOR = true;

const log = require('log');

log(1)(opts);

(require('./homePage')).init(opts);