import bookmark from './bookmark.js';
import search from './search.js';

const socketEndpoints = {
	init({ log, socketServer }) {
		socketEndpoints.log = log;

		socketServer.registerEndpoints(socketEndpoints.endpoints);
	},
	endpoints: {
		client_connect() {
			socketEndpoints.log(3)('Client connected');

			this.reply('connected', true);
		},
		request_state() {
			socketEndpoints.log(3)('Requested state');

			this.reply('state', bookmark.read());
		},
		bookmark_edit({ id, remove = false, update = {} }) {
			socketEndpoints.log(`${typeof index === 'number' ? (remove ? 'Delete' : 'Edit') : 'Create'} bookmark: ${update.name || id}`);

			if (id === 'new' && update.name) id = bookmark.create({ update });
			else if (update) id = bookmark.update({ id, update });
			else if (remove) id = bookmark.remove({ id });

			this.reply('bookmark_edit', { success: true, id });
		},
		search(keyword) {
			const { reply } = this;

			search(keyword, (err, suggestions) => {
				if (err) return socketEndpoints.log.error(err);

				reply('search', { keyword, suggestions });
			});
		},
	},
};

export default socketEndpoints;
