# Search

> server/database/searchEngines.js

Search extends the bookmark model to queries. Engines are user-configurable records in the same database as bookmarks -- the user controls what search means. An engine requires a URL template with a `:term` placeholder; without it there is no search, just a link.

The document points at the engine record by default, because that is where an engine is defined. The
groups that describe *searching* override the module to `server/utils/search.js`, which is where the
template is resolved, the protocol is checked, and the response is normalized. A record and the act
of using it are different design decisions, so each search claim points at the module that owns the
behavior it describes.

## Engines as records

- search engines are stored in the database, not written in code
  - create({"label":"Test","url":"https://example.com/?q=:term"}) captures r -> r.id is defined
- only declared fields survive a write
  - create({"label":"Test","url":"https://example.com/?q=:term","bogus":"y"}) captures r -> r.bogus === undefined
- missing fields default to empty string, not null
  - create({"label":"Test","url":"https://example.com/?q=:term"}) captures r -> r.resultsPath === ""

## Validation timing

- engine URL validity is checked when a search is executed, not when an engine is saved // a half-written engine is a normal state in the middle of editing one; refusing to save it would make the form unusable, and the search is the moment the URL has to be real
  - create({"label":"Broken","url":"not a url at all"}) captures r -> r.id is defined

## Searching an engine that is gone

**module:** `server/utils/search.js`
**method:** `searchProvider`

An engine can be deleted while a client still holds its id. That is a normal race, not an error
condition, so it resolves to nothing rather than throwing.

- searchProvider("no-such-engine", "anything") captures r -> r.length === 0

## Protocol enforcement

**module:** `server/utils/search.js`
**method:** `searchProvider`

- only http and https are permitted in the resolved template URL // the template is user-editable data fetched by the server, so a non-web scheme is refused. This filters the scheme of the resolved template only -- it does not inspect redirect targets the fetch may follow, nor block private or loopback hosts, so it is a scheme filter, not a full egress boundary -- on an unauthenticated LAN these fetch-proxy routes (search, brand-color, favicon-preview) can be pointed at internal services
  - searching with a bad protocol throws an error naming the disallowed protocol

## Results are a list, normalized, and ordered by the engine

**module:** `server/utils/search.js`
**method:** `searchProvider`
**mock-http:** `{ "items": [{ "title": "beta", "href": "https://b.example" }, { "title": "alpha", "href": "https://a.example" }] }`

These need a search run against a *stored* engine, so each claim creates one and hands its id
straight to `searchProvider`. The engine is the fixture; naming its configuration inline is what
makes the claim readable as a statement about that configuration.

- a search returns a list of links the client renders, never a redirect it follows blindly // the server hands back data the client decides what to do with, so nothing navigates on a URL that was never inspected
  - searchProvider((await Subject.create({ label: "L", url: "https://lld.test/?q=:term", resultsPath: "items" })).id, "x") captures r -> r.length === 2
- every engine's response is normalized to the same `{ name, url }` shape, so one result component serves all of them // the engine's own response shape stops at this boundary and never reaches the client
  - searchProvider((await Subject.create({ label: "L", url: "https://lld.test/?q=:term", resultsPath: "items", nameProperty: "title", urlProperty: "href" })).id, "x") captures r -> r[0].name === "beta" && r[0].url === "https://b.example"
- when `orderBy` is set the sort happens server-side, so every client gets the same order without implementing it // ordering is part of what the engine configuration means, and a client that re-sorted would be duplicating a decision already made
  - searchProvider((await Subject.create({ label: "L", url: "https://lld.test/?q=:term", resultsPath: "items", nameProperty: "title", orderBy: "name" })).id, "x") captures r -> r[0].name === "alpha"
- an ordered engine that matches nothing returns an empty list rather than failing // a search with no results is an ordinary outcome, and sorting is something you do to results you have
  - searchProvider((await Subject.create({ label: "L", url: "https://lld.test/?q=:term", resultsPath: "missing", orderBy: "name" })).id, "x") captures r -> r.length === 0
