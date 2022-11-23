import bookmark from './bookmark.js';
import search from './search.js';

const router = {
	init({ express, app }) {
		app.use(express.static('client/dist'));

		app.use(express.json());

		app.get('/bookmarks', function (req, res) {
			res.json(bookmark.read());
		});

		app.post('/bookmarks', function (req, res) {
			console.log(`Create bookmark: ${req.body.name}`);

			const id = bookmark.create(req.body);

			res.json({ id });
		});

		app.put('/bookmarks/:id', function (req, res) {
			console.log(`Update bookmark: ${req.params.id}`);

			bookmark.update({ id: req.params.id, update: req.body });

			res.json({ id: req.params.id });
		});

		app.delete('/bookmarks/:id', function (req, res) {
			console.log(`Delete bookmark: ${req.params.id}`);

			bookmark.remove({ id: req.params.id });

			res.json({ id: req.params.id });
		});

		app.get('/search/:term', function (req, res) {
			console.log(`Search: ${req.params.term}`);

			search(req.params.term, (error, suggestions) => {
				if (error) return res.status(500).json({ error });

				res.json({ suggestions });
			});
		});

		app.use(function (req, res) {
			res.status(404);

			if (req.accepts('json')) return res.json({ error: 'Not found' });

			res.type('txt').send('Not found');
		});
	},
};

export default router;
