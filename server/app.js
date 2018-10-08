const Fs = require('fs');
const Path = require('path');
const Exec = require('child_process').exec;

const Polka = require('polka');
const StaticServer = require('serve-static');
const BodyParser = require('body-parser');
const CookieParser = require('cookie-parser');

const Log = require(process.env.DIST ? `${__dirname}/_log` : `${__dirname}/../../swiss-army-knife/js/_log`);
const Cjs = require(process.env.DIST ? `${__dirname}/_common` : `${__dirname}/../../swiss-army-knife/js/_common`);

const System = require(`${__dirname}/services/system`);
const Sockets = require(`${__dirname}/services/sockets`);

const PublicDir = Path.join(__dirname, process.env.DIST ? 'resources' : '../client/public');

const HomePath = '/home';

const App = Polka({
	onError: function(err, req, res, next){
		if(!err || !err.code){
			if(err instanceof Object) err.code = 500;

			else err = { err: err, code: 500 };
		}

		var detail;

		try{
			detail = err.detail || JSON.stringify(err, null, '  ');
		}

		catch(e){
			detail = 'Unknown error!';
		}

		var titles = {
			'401': '401 - Unauthorized',
			'403': '403 - Forbidden',
			'404': '404 - Not Found',
			'500': '500 - Internal Server Error'
		};

		Log.error()(`${req.originalUrl} | ${titles[err.code]}`);
		Log.error(1)(err);

		if(err.redirectPath){
			Log()(`Redirecting to: ${err.redirectPath}`);

			return res.redirect(307, err.redirectPath);
		}

		var file = Fs.readFileSync(Path.join(__dirname, process.env.DIST ? 'resources' : '../client/public', 'error.html'), 'utf8');

		if(!file){
			Log.error()('Unable to read error html file');

			return res.status(500).end('ERROR');
		}

		file = file.replace(/XXX/g, titles[err.code] || err.code);
		file = file.replace(/YYY/g, detail);

		res.status(err.code).end(file);
	}
});

App.get('/dbg', function(req, res, next){
	if(!process.env.DBG) res.send('not in debug mode');

	Sockets.sendTo('*', { command: 'notify', opts: { className: 'success', message: 'Unit updated! Reloading now...', force: 1 } });
	Sockets.sendTo('*', { command: 'reload', delay: 1500 });

	res.send('reloaded clients');
});

App.use(function(req, res, next){
	Log()(`\nReq Url - ${req.originalUrl}`);

	res.sendFile = function(path){
		Log()(`Send file - ${path}`);

		Fs.readFile(path, function(err, file){
			res.end(file);
		});
	};

	res.json = function(json){
		Log()('Send JSON - ', json);

		res.writeHead(200, { 'Content-Type': 'application/json' });

		res.end(JSON.stringify(json));
	};

	res.redirect = function(code, path){
		Log()(`${code} redirect - ${path}`);

		res.writeHead(code, { 'Location': path });

		res.end();
	};

	res.send = function(string){
		Log()(`Send string - "${string}"`);

		res.end(string);
	};

	res.status = function(code){
		res.statusCode = code;

		return res;
	};

	next();
});

App.use(function redirectTrailingWak(req, res, next){
	var splitReqUrl = req.originalUrl.split('?');
	var path = splitReqUrl[0];

	if(path.slice(-1) !== '/') return next();
	path = path.slice(0, -1);

	var query = splitReqUrl[1];

	res.redirect(301, path ? (path + (query ? ('?'+ query) : '')) : HomePath);
});

App.use(BodyParser.json());

App.use(BodyParser.urlencoded({ extended: false }));

App.use(CookieParser());

App.get('/testj', function(req, res){
	Log()('Testing JSON...');

	res.json({ test: 1 });
});

App.get('/test', function(req, res){
	Log()('Testing...');

	res.send('{ test: 1 }');
});

App.use(StaticServer(PublicDir));

App.get('/home', function(req, res){
	res.sendFile(Path.join(PublicDir, 'home.html'));
});

App.get('/bookmarks', function(req, res){
	res.json(System.config.systemSettings.bookmarks);
});

App.post('/bookmarks/add', function(req, res){
	if(req.body.name && req.body.url){
		System.config.systemSettings.bookmarks[req.body.name] = req.body.url;

		System.saveConfig();
	}

	res.json(System.config.systemSettings.bookmarks);
});

App.post('/bookmarks/edit/:name', function(req, res){
	if(req.params.name) delete System.config.systemSettings.bookmarks[decodeURIComponent(req.params.name)];

	if(req.body.name && req.body.url){
		System.config.systemSettings.bookmarks[req.body.name] = req.body.url;

		if(!System.config.systemSettings.bookmarks[req.body.name]) delete System.config.systemSettings.bookmarks[req.body.name];

		System.saveConfig();
	}

	res.json(System.config.systemSettings.bookmarks);
});

App.delete('/bookmarks/:name', function(req, res){
	if(req.params.name){
		delete System.config.systemSettings.bookmarks[decodeURIComponent(req.params.name)];

		System.saveConfig();
	}

	res.json(System.config.systemSettings.bookmarks);
});

Log()('info', 'Request router loaded!');

System.loadConfig(Log.error(), function(){
	App.listen(System.config.systemSettings.port).then(function(){
		Log()('info', 'HTTP server is running!');

		Fs.readFile(`${__dirname}/logo`, function(err, data){
			process.stdout.write(data);

			Exec(`ip addr | grep 'state UP' -A2 | head -n3 | tail -n1 | awk '{print $2}' | cut -f1	-d'/'`, function(err, stdout, stderr){
				System.ip_address = stdout;

				Log.info()('IP: ', stdout);

				System.sockets = Sockets.init(App.server);

				Log.info()(`-	Version ${System.version}	-`);
			});
		});
	});
});