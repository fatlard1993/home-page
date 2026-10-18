import { crudRoutes } from '@vanilla-bean/components/app';

import categories from '../database/categories';

// DELETE /categories/:id?moveTo=<id> moves its bookmarks rather than deleting them (see the store's afterDelete)
export default crudRoutes('/categories', categories);
