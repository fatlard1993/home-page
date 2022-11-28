import bookmarksRouter from './bookmarks.js';
import categoriesRouter from './categories.js';
import searchRouter from './search.js';

const router = {
	init({ express, app }) {
		app.use(express.static('client/dist'));

		app.use(express.json());

		bookmarksRouter({ express, app });

		categoriesRouter({ express, app });

		searchRouter({ express, app });

		app.use(function (req, res) {
			res.status(404);

			if (req.accepts('json')) return res.json({ error: 'Not found' });

			res.type('txt').send('Not found');
		});
	},
};

export default router;
