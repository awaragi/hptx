# Spec Delta: slide-local-images

## MODIFIED Requirements

### Requirement: Early applicator from one registry
The assembled document MUST include a synchronous early script that reads the registry once, sets each `--asset-<id>` custom property on the document element to `url("<data-uri>")`, and assigns `src` on every `img[data-asset]` and `source[data-asset]` from the same registry — including nodes inside `<template>` content (inert `DocumentFragment`s), with nested templates visited recursively. The base64 payload MUST NOT be duplicated into a separate static CSS copy of the same data URIs.

#### Scenario: CSS and img share one payload
- **WHEN** the same asset id is used by a CSS `var(--asset-…)` and an `<img data-asset>`
- **THEN** the assembled HTML stores that data URI once in the registry and both surfaces receive it via the early script

#### Scenario: Runs before first paint of slides
- **WHEN** the assembled document is opened
- **THEN** the applicator script runs synchronously from `<head>` before slide bodies depend on the custom properties

#### Scenario: Img inside template is hydrated at boot
- **WHEN** assembled markup contains `<template><img data-asset="<id>" alt="x"></template>` for a registry id
- **THEN** after the applicator runs, that `img` inside `template.content` has `src` equal to the registry data URI for `<id>`

#### Scenario: Cloned template markup already has src
- **WHEN** a slide clones or injects hydrated template content that contains `img[data-asset]` or `source[data-asset]`
- **THEN** the inserted nodes already have `src` set from the registry without a further author call

## ADDED Requirements

### Requirement: Public re-apply helper for post-boot inserts
The early assets script MUST expose `window.__deckApplyAssets(root?)` on the real page `window` (not the slide-scoped document). When called, it MUST assign `src` from the same registry on `img[data-asset]` and `source[data-asset]` under `root` (defaulting to the page document), including nodes inside `<template>` content under that root. Authors MUST NOT be required to read `#deck-assets` via `window.document` for this purpose.

#### Scenario: Apply after createElement insert
- **WHEN** slide script inserts an `img` with `data-asset` after boot and calls `window.__deckApplyAssets` with a root that contains that node
- **THEN** the `img` receives `src` from the registry for that asset id

#### Scenario: Helper is on the page window
- **WHEN** a slide script runs under slide-scoped `document`
- **THEN** `window.__deckApplyAssets` is still callable and applies assets without looking up `#deck-assets` through the slide-scoped document
