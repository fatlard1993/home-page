# Persistence

> server/database/database.js

All application data lives in a single local JSON file. This is a deliberate choice: no infrastructure to install, no server to run, no migration to write. The data is local and the app has no external dependency for its primary function -- reads require no network call and no startup wait. The file is plain JSON and can travel with the user in a dotfiles repository.

## Write queue

Write ordering is structural, not a mutex.

- all writes go through a single queue; concurrent writes are structurally impossible
  - do concurrent writes complete in the order they were submitted?

## Write recovery

Error recovery is structural, not bolted on.

- a failed write does not stall the queue
  - does the queue continue after a write failure?

## Schema migration

**module:** `server/database/bookmarks.js`

Adding a field to an entity's declared list needs no migration pass: a record written before the
field existed has no value for it, and the write path fills every declared field. The check
belongs on an entity rather than on `database.js`: the raw store holds whatever it is handed and has
no field list to complete, so it is the `createCRUD` declaration (in `server/database/crud.js`) that
makes this true.

- new records always have complete field sets; reads of old records return their stored values unchanged
  - do missing fields default to empty string, not null?
  - does a record stored before a field was declared read back with its stored values unchanged?
