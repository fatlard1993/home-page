import { Router } from '@vanilla-bean/components';

import Bookmarks from './Bookmarks';

const router = new Router({ views: { '/bookmarks': Bookmarks } });

export default router;
