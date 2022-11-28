import bookmarks from '../database/bookmarks.js';

const bookmarksRouter = ({ app }) => {
	app.get('/bookmarks', function (req, res) {
		res.json(bookmarks.read());
	});

	app.get('/bookmarks/:id', function (req, res) {
		res.json(bookmarks.read({ id: req.params.id }));
	});

	app.post('/bookmarks', function (req, res) {
		console.log(`Create bookmark: ${req.body.name}`, req.body);

		const id = bookmarks.create(req.body);

		res.json({ id });
	});

	app.put('/bookmarks/:id', function (req, res) {
		console.log(`Update bookmark: ${req.params.id}`, req.body);

		bookmarks.update({ id: req.params.id, update: req.body });

		res.json({ id: req.params.id });
	});

	app.delete('/bookmarks/:id', function (req, res) {
		console.log(`Delete bookmark: ${req.params.id}`);

		bookmarks.delete({ id: req.params.id });

		res.json({ id: req.params.id });
	});
};

export default bookmarksRouter;
