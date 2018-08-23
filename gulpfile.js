const Gulp = require('gulp');

const Compile = {
	scss: require('../swiss-army-knife/gulpfiles/compileSCSS'),
	js: require('../swiss-army-knife/gulpfiles/compileJS'),
	html: require('../swiss-army-knife/gulpfiles/compileHTML')
};
const Watcher = require('../swiss-army-knife/gulpfiles/watcher');
const Dist = require('../swiss-army-knife/gulpfiles/dist');

Gulp.task('compile-js', function(){ Compile.js('client/public/js'); });

Gulp.task('compile-css', function(){ Compile.scss('client/public/css'); });

Gulp.task('compile-html', function(){ Compile.html('client/public'); });

Gulp.task('compile', ['compile-js', 'compile-css', 'compile-html']);

Gulp.task('dev', ['compile'], function(){
	Watcher(Gulp);
});

Gulp.task('default', ['compile']);

Gulp.task('dist-clean', Dist.clean);

Gulp.task('dist-client', Dist.bind(null, [
	{ src: 'client/public/js/*', dest: 'js' },
	{ src: 'client/public/css/*', dest: 'css' },
	{ src: 'client/public/html/*', dest: 'html' }
], 'resources'));

Gulp.task('dist-server', Dist.bind(null, [
	{ src: '../swiss-army-knife/js/_log.js' },
	{ src: '../swiss-army-knife/js/_common.js' },
	{ src: 'server/logo.txt' },
	{ src: 'server/app.js' },
	{ src: 'server/services/*', dest: 'services' },
	{ src: '../swiss-army-knife/server/middleware/errors.js', dest: 'middleware' },
	{ src: '../swiss-army-knife/server/services/config.js', dest: 'services' }
]));

Gulp.task('dist-dev', ['dist-client', 'dist-server']);

Gulp.task('dist-release', ['dist-dev'], Dist.bind(null, [
	{ src: '../swiss-army-knife/client/fonts/*', dest: 'fonts' }
]));