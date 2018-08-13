const fs = require('fs');
const path = require('path');
const Execute = require('child_process').exec;
// const http = require('http');

const polka = require('polka'), app = polka();
const staticServer = require('serve-static');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const Log = require(process.env.DIST ? `${__dirname}/_log` : `${__dirname}/../../swiss-army-knife/js/_log`);
const Cjs = require(process.env.DIST ? `${__dirname}/_common` : `${__dirname}/../../swiss-army-knife/js/_common`);

const System = require(`${__dirname}/services/system`);
const Errors = require(`${__dirname}/middleware/error`);
const Sockets = require(`${__dirname}/services/sockets`);

const publicDir = path.join(__dirname, process.env.DIST ? `/resources` : `/../client/public`);

(function start(){
	System.loadConfig(function(err){
		if(err) Log.error(err);

		appInit(function(){
			System.sockets = Sockets.init(app.server);

			Log.info()(`-	Version ${System.VERSION}	-`);
		});
	});
})();

function appInit(cb){
	app.get('/dbg', function(req, res, next){
		if(process.env.DBG){
			Sockets.sendTo('*', { command: 'notify', opts: { className: 'success', message: 'Unit updated! Reloading now...', force: 1 } });
			Sockets.sendTo('*', { command: 'reload', delay: 1500 });

			res.send('reloaded clients');
		}

		else res.send('not in debug mode');
	});

	app.get('/test', function(req, res, next){
		Log()('Testing...');

		res.send('test');
	});

	app.use(function(req, res, next){
		if(process.env.DIST && req.socket.remoteAddress !== '::1') return res.end();

		next();
	});

	app.use(staticServer(publicDir));

	app.get('*', function redirectTrailingWak(req, res, next){
		var queryStringIndex = req.originalUrl.indexOf('?');
		var path = req.originalUrl.slice(0, ((queryStringIndex >= 0) ? queryStringIndex : req.originalUrl.length));

		if(path.slice(-1) !== '/') return next();

		var redirectPath = path.slice(0, (path.length - 1)) + ((queryStringIndex > -1) ? req.originalUrl.slice(queryStringIndex) : '');

		res.redirect(301, redirectPath);
		Log()('301 redirected '+ req.originalUrl +' to '+ redirectPath);
	});

	app.use(bodyParser.urlencoded({ extended: false }));

	app.use(bodyParser.json());

	app.use(cookieParser());

	//

	app.use(Errors.four0four);

	app.use(Errors.catch);

	Log()('info', 'Request router loaded!');

	try{
		app.listen(System.config.systemSettings.httpPort).then(function(){
			Log()('info', 'HTTP server is running!');

			fs.readFile(`${__dirname}/logo`, function(err, data){
				process.stdout.write(data);

				Execute(`ip addr | grep 'state UP' -A2 | head -n3 | tail -n1 | awk '{print $2}' | cut -f1	-d'/'`, function(err, stdout, stderr){
					System.ip_address = stdout;

					Log.info()('IP: ', stdout);

					cb();
				});
			});
		});
	}

	catch(e){
		Log.error()(e);

		Log()('Maybe node is already running?');
	}
}