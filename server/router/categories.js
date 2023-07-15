import categories from '../database/categories.js';

const categoriesRouter = ({ app }) => {
	app.get('/bookmarks/categories', function (request, response) {
		response.json(categories.read());
	});

	app.get('/bookmarks/categories/:id', function (request, response) {
		response.json(categories.read({ id: request.params.id }));
	});

	app.post('/bookmarks/categories', function (request, response) {
		console.log(`Create category: ${request.body.name}`, request.body);

		const id = categories.create(request.body);

		response.json({ id });
	});

	app.put('/bookmarks/categories/:id', function (request, response) {
		console.log(`Update category: ${request.params.id}`, request.body);

		categories.update({ id: request.params.id, update: request.body });

		response.json({ id: request.params.id });
	});

	app.delete('/bookmarks/categories/:id', function (request, response) {
		console.log(`Delete category${request.params.removeBookmarks ? ' and bookmarks' : ''}: ${request.params.id}`);

		categories.delete({ id: request.params.id, removeBookmarks: request.params.removeBookmarks });

		response.json({ id: request.params.id });
	});
};

export default categoriesRouter;
