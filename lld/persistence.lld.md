# Persistence
> server/database/database.js

All application data lives in a single local JSON file. This is a deliberate choice: no infrastructure to install, no server to run, no migration to write. The data is local and the app has no external dependency for its primary function. The file is plain JSON and can travel with the user in a dotfiles repository.

## The file is the database

- reads require no network and no startup wait

## Write queue

- all writes go through a single queue; concurrent writes are structurally impossible
- write ordering is structural, not a mutex
  - do concurrent writes complete in the order they were submitted?

## Write recovery

- a failed write does not stall the queue
- error recovery is structural, not bolted on
  - does the queue continue after a write failure?

## Schema enforcement
**module:** `server/database/bookmarks.js`

- only declared fields survive a write
- missing fields default to empty string, not null

## Schema migration

- new records always have complete field sets; reads of old records return their stored values unchanged
  - do existing records get empty string defaults for new fields?
