import search from '../search.js';

const searchRouter = ({ app }) => {
	app.get('/search/:term', function (req, res) {
		console.log(`Search: ${req.params.term}`);

		search(req.params.term, (error, suggestions) => {
			if (error) return res.status(500).json({ error });

			res.json({ suggestions });
		});
	});
};

export default searchRouter;
