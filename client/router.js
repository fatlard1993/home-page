import { Router } from 'vanilla-bean-components';

import Bookmarks from './Bookmarks';

const paths = { bookmarks: '/Bookmarks' };
const views = { [paths.bookmarks]: Bookmarks };

const router = new Router({ views });

export default router;
