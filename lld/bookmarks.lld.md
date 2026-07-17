# Bookmarks

> server/database/bookmarks.js

A bookmark is a link with enough context to be found and used again. The URL is the executable part -- it is what gets opened. Name and color are for the user to read; they do not affect execution. Categories are the user's choice, not the system's requirement.

## Bookmark validity

- a name and URL are the only required fields
- an uncategorized bookmark is a valid state, not an error condition

## Schema enforcement

- only declared fields survive a write
- missing fields default to empty string, not null

## Inline category creation

- adding a bookmark can create a new category in the same operation

## Category structure

- a bookmark belongs to at most one category
  - does the category field hold a string value?

## Category list

- categories are a flat collection
  - does readCategories return an array?

## Name mutability

- all fields can be updated after a bookmark is created
- an update changes only the fields provided — omitted fields retain their current value
  - does the name field update take effect?

## Url mutability

- url can be changed after a bookmark is created
  - does the url field update take effect?

## Category isolation

- changing a bookmark's category affects only that bookmark
  - does the other bookmark retain its original category?

## Category deletion

**module:** `server/database/categories.js` **method:** `deleteOrphans`

- deleting a category removes or reassigns its bookmarks — no bookmark is left orphaned
- if a destination category is provided, affected bookmarks are moved to it; otherwise they are deleted
  - does deleteAndMove reassign the bookmark's category?
  - does the deleted category become → absent from the categories collection?
- a snapshot of affected bookmarks is taken before the operation; any failure mid-loop restores them from the snapshot
