import bookmarks from '../database/bookmarks.js';

const bookmarksRouter = ({ app }) => {
	app.get('/bookmarks', function (request, response) {
		response.json(bookmarks.read());
	});

	app.get('/bookmarks/:id', function (request, response) {
		response.json(bookmarks.read({ id: request.params.id }));
	});

	app.post('/bookmarks', function (request, response) {
		console.log(`Create bookmark: ${request.body.name}`, request.body);

		const id = bookmarks.create(request.body);

		response.json({ id });
	});

	app.put('/bookmarks/:id', function (request, response) {
		console.log(`Update bookmark: ${request.params.id}`, request.body);

		bookmarks.update({ id: request.params.id, update: request.body });

		response.json({ id: request.params.id });
	});

	app.delete('/bookmarks/:id', function (request, response) {
		console.log(`Delete bookmark: ${request.params.id}`);

		bookmarks.delete({ id: request.params.id });

		response.json({ id: request.params.id });
	});
};

export default bookmarksRouter;
