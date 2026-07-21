# Theory of Operation

This document explains how `metalsmith-safe-links` works and why it is built
the way it is. The README covers usage; this covers design.

## Problem

A site is authored with absolute URLs to its own domain (or to a staging
domain), but it needs to be served from a different origin — often a
subdirectory like `https://example.com/my-app/`. Hard-coded absolute internal
URLs break under that move, and hand-editing every `href`/`src` is error-prone.
Separately, links that genuinely point off-site should open safely
(`target="_blank"` with `rel="noopener noreferrer"`). This plugin rewrites URLs
across a built HTML site so internal references become origin-relative (with an
optional base path) and external anchors get the safe-link attributes.

## Approach

The plugin runs after HTML exists (after Markdown and layouts). For each HTML
file it parses the DOM with Cheerio and walks every URL-bearing attribute
across a fixed set of elements — `<a href>`, `<link href>`, `<script src>`,
`<img src>`, `<iframe src>`, `<source src>`, `<track src>`, `<embed src>`,
`<form action>`, `<object data>`, `<video poster>`, `<area href>`,
`<meta content>` — plus CSS `url()` functions inside `style` attributes. Each
URL is classified and rewritten:

- **Absolute URL whose hostname is in `hostnames`** → strip
  `protocol://hostname`, then prepend `basePath` → origin-relative.
- **Root-relative URL (`/…`)** → prepend `basePath`.
- **External URL** → left as-is; if it's an `<a>`, add `target="_blank"` and
  `rel="noopener noreferrer"`.
- **Path-relative (`./`, `../`), `mailto:`, `tel:`, `#anchor`, `data:`** → left
  untouched (the browser resolves these correctly).

The work is decomposed into `src/processors/` (file, URL, and style
processors) and `src/config/selectors.js` (the element/attribute map), so the
element coverage is data-driven and each transform is independently testable.

## Key decisions

- **Hostname allow-list, not a guess.** "Local" is defined explicitly by the
  `hostnames` option. With no hostnames the plugin does nothing and warns,
  rather than guessing which domains are internal and rewriting the wrong ones.
- **`hostnames` stored as a `Set`.** Lookups are per-URL and per-file; a `Set`
  keeps classification O(1).
- **External `target`/`rel` on anchors only.** Adding `target="_blank"` to a
  `<link>` or `<img>` would be meaningless or harmful, so the safe-link
  attributes are scoped to `<a>`.
- **CSS `url()` handled with format preservation.** Single-quoted,
  double-quoted, unquoted, and spaced `url( … )` forms are all recognized and
  rewritten while preserving the original quoting/spacing, so style attributes
  are not reflowed.

## Invariants and failure modes

- **Runs on HTML files only.** Files are filtered by `isHTMLFile`; non-HTML is
  skipped.
- **No hostnames → no-op.** The plugin returns an early `done()` (and warns
  once) rather than processing anything.
- **Errors propagate.** Per-file processing runs inside try/catch; any throw is
  routed to `done(error)` so the build fails loudly.
- **Options are copied, not mutated.** Defaults merge into a fresh `opts`
  object per invocation; the caller's options object is never mutated.
- **Special URI schemes are preserved.** `mailto:`, `tel:`, `data:`, and hash
  references are recognized and left unchanged.
