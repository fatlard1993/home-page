# Persistence

> server/database/database.js

All application data lives in a single local JSON file. This is a deliberate choice: no infrastructure to install, no server to run, no migration to write. The data is local and the app has no external dependency for its primary function -- reads require no network call and no startup wait. The file is plain JSON and can travel with the user in a dotfiles repository.

## Write queue

**module:** `server/database/bookmarks.js`

Write ordering is structural, not a mutex. Each collection is a `createStore` store, and a store takes its
changes one at a time: a change waits for the one before it to be written, so a slow write is never
overtaken. Changes from different collections meet at the file, whose writer also takes them one at a
time. The check is made on a collection because that is where the queue is; `database.js` only hands each
change's turn to the file.

- all writes go through a single queue; concurrent writes are structurally impossible
  - do concurrent writes complete in the order they were submitted?

## Write recovery

**module:** `server/database/bookmarks.js`

Error recovery is structural, not bolted on. A change whose write fails is undone and its error reported,
and the next change still gets its turn.

- a failed write does not stall the queue
  - does the queue continue after a write failure?

## Schema migration

**module:** `server/database/bookmarks.js`

Adding a field to an entity's declared list needs no migration pass: a record written before the
field existed has no value for it, and the write path fills every declared field. The check
belongs on an entity rather than on `database.js`: the raw store holds whatever it is handed and has
no field list to complete, so it is each collection's `createStore` declaration that makes this true.

- new records always have complete field sets; reads of old records return their stored values unchanged
  - do missing fields default to empty string, not null?
  - does a record stored before a field was declared read back with its stored values unchanged?
