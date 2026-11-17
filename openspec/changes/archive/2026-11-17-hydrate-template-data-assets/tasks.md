# Tasks

## 1. Applicator runtime

- [x] 1.1 Update `emitAssetsHtml` so boot applies `src` from the registry to live `img`/`source[data-asset]` and recursively to nodes inside `<template>` content; expose `window.__deckApplyAssets(root?)` as the same apply function; verify string emission still includes the registry and helper name
- [x] 1.2 Add Vitest (JSDOM) coverage: after the applicator runs, an `img[data-asset]` inside `template.content` has the registry `src`; calling `__deckApplyAssets` on a late-inserted node sets `src`; existing bake/assemble cases still pass

## 2. Docs

- [x] 2.1 Document template hydration at boot and `window.__deckApplyAssets(root?)` under Writing slides in `README.md`; verify the section mentions both behaviors

## Workflow follow-up

- Archive the change after review (`/opsx-archive`).
