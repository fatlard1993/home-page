import search from '../search.js';

const searchRouter = ({ app }) => {
	app.get('/search/:term', function (request, response) {
		console.log(`Search: ${request.params.term}`);

		search(request.params.term, (error, suggestions) => {
			if (error) return response.status(500).json({ error });

			response.json({ suggestions });
		});
	});
};

export default searchRouter;
