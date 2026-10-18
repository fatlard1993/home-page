import { crudRoutes } from '@vanilla-bean/components/app';

import searchEngines from '../database/searchEngines';

export default crudRoutes('/search/engines', searchEngines);
