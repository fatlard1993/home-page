import { createStore } from '@vanilla-bean/components/app';

import database from '.';

// A collection in home-page's one database, through the library's store. lldtdd finds a module's collection and
// database by this call's shape, so the lld documents get a database of their own to run against.
export const createCRUD = (collection, fields, hooks) => createStore({ db: database, collection, fields, hooks });
