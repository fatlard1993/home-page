import { Router } from 'vanilla-bean-components';

import { Bookmarks } from './components/views';

const ROUTES = {
	bookmarks: '/bookmarks',
};

const VIEWS = {
	[ROUTES.bookmarks]: Bookmarks,
};

const DEFAULT_PATH = ROUTES.bookmarks;

const router = new Router({
	routes: ROUTES,
	views: VIEWS,
	defaultPath: DEFAULT_PATH,
});

export default router;
