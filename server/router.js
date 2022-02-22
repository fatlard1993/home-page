import fs from 'fs';
import path from 'path';

const router = {
	init({ express, app }) {
		app.use(express.static('../client/dist'));

		const localFileRoots = [];

		app.use((req, res, next) => {
			if (req.path !== '/load-file' || req.method !== 'GET') return next();

			localFileRoots.push(req.query.file.replace(/[^/]+\..+$/, ''));

			res.sendFile(req.query.file);
		});

		app.use((req, res, next) => {
			if (req.path !== '/' || req.method !== 'GET') return next();

			res.sendPage('home-page');
		});

		app.use((req, res, next) => {
			if (req.path === '/load-file' || !localFileRoots) return next();

			const filePath = req.path.replace(/\?.+$/, '');
			const fileRoot = localFileRoots.find(localFileRoot => fs.existsSync(path.join(localFileRoot, filePath)));

			if (!fileRoot) return next();

			res.sendFile(path.join(fileRoot, filePath));
		});

		// app.use(staticServer(rootPath('src/client/resources')), staticServer(rootPath('node_modules/@fortawesome/fontawesome-free')), staticServer(rootPath('node_modules/source-code-pro')));

		app.use((req, res, next) => {
			next(req.path !== '/load-file' && res.reqType === 'file' ? { code: 404, detail: `Could not find ${req.originalUrl}` } : null);
		});

		app.use((req, res, next) => {
			if (res.reqType !== 'page') return next();

			res.redirect(307, '/');
		});
	},
};

export default router;
