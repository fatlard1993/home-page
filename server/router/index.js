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

		app.use(function (request, response) {
			response.status(404);

			if (request.accepts('json')) return response.json({ error: 'Not found' });

			response.type('text').send('Not found');
		});
	},
};

export default router;
