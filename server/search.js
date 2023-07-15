import http from 'http';

export default function search(term, done) {
	try {
		http
			.get(`http://suggestqueries.google.com/complete/search?client=chrome&q=${term}`, response => {
				if (response.statusCode !== 200) {
					response.resume();

					return console.error(`Suggestion request failed with code: ${response.statusCode}`);
				}

				let data = '';

				response.setEncoding('utf8');

				response.on('data', chunk => {
					data += chunk;
				});

				response.on('end', () => {
					try {
						data = JSON.parse(data)[1].slice(0, 3);
					} catch (error) {
						return done(error);
					}

					done(undefined, data);
				});
			})
			.on('error', error => {
				console.error('Resource request error:', error);
			});
	} catch (error) {
		console.error('Suggestion request failed', error);

		done(error);
	}
}
