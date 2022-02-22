import http from 'http';
import https from 'https';

export default function search(keyword, done) {
	// log(3)(`Requesting suggestions for ${keyword}`);

	const client = { http, https };

	try {
		client.http
			.get(`http://suggestqueries.google.com/complete/search?client=chrome&q=${keyword}`, res => {
				if (res.statusCode !== 200) {
					res.resume();

					return console.error(`Suggestion request failed with code: ${res.statusCode}`);
				}

				let data = '';

				res.setEncoding('utf8');

				res.on('data', chunk => {
					data += chunk;
				});

				res.on('end', () => {
					try {
						data = JSON.parse(data)[1].slice(0, 3);
					} catch (err) {
						return done(err);
					}

					done(null, data);
				});
			})
			.on('error', err => {
				console.error('Resource request error: ', err);
			});
	} catch (err) {
		console.error('Suggestion request failed', err);

		done(err);
	}
}
