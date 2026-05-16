# Search
> server/database/searchEngines.js

Search extends the bookmark model to queries. Engines are user-configurable records in the same database as bookmarks -- the user controls what search means. An engine requires a URL template with a `:term` placeholder; without it there is no search, just a link.

## Engines as records
**method:** `searchWithDefaultEngine`

- search engines are stored in the database, not written in code
  - does creating a search engine succeed?
- the user can add, modify, and remove search providers without changing the app
  - does a new engine work immediately after being added?
- a new engine takes effect immediately
  - does a search return a list of results?

## Results as links

- a search request returns a list of links, not a redirect
  - does a search return a list of results?

## Result normalization

- results from different engine schemas are normalized to the same shape
  - do two differently-configured engines produce results with the same structure?

## Validation timing

- engine URL validity is checked when a search is executed, not when an engine is saved
  - does saving an engine with a dangerous URL succeed?
- validation targets the final URL, not the template
  - does saving a dangerous URL succeed?

## Protocol enforcement

- only http and https are permitted in the final resolved URL
  - searching with a bad protocol throws an error detailing the protocol violation
  - does the error message → contains "protocol" to identify what was rejected?

## Result ordering

- the `orderBy` field is stored with the engine record
  - does creating an engine with orderBy set preserve that field?
- when orderBy is set, results are sorted server-side before being returned
