import categories from '../database/categories.js';

const categoriesRouter = ({ app }) => {
	app.get('/bookmarks/categories', function (req, res) {
		res.json(categories.read());
	});

	app.get('/bookmarks/categories/:id', function (req, res) {
		res.json(categories.read({ id: req.params.id }));
	});

	app.post('/bookmarks/categories', function (req, res) {
		console.log(`Create category: ${req.body.name}`, req.body);

		const id = categories.create(req.body);

		res.json({ id });
	});

	app.put('/bookmarks/categories/:id', function (req, res) {
		console.log(`Update category: ${req.params.id}`, req.body);

		categories.update({ id: req.params.id, update: req.body });

		res.json({ id: req.params.id });
	});

	app.delete('/bookmarks/categories/:id', function (req, res) {
		console.log(`Delete category${req.params.removeBookmarks ? ' and bookmarks' : ''}: ${req.params.id}`);

		categories.delete({ id: req.params.id, removeBookmarks: req.params.removeBookmarks });

		res.json({ id: req.params.id });
	});
};

export default categoriesRouter;
