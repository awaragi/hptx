# Proposal

## Why

Authors want to temporarily disable a slide in `deck.json` by commenting it out (then build and distribute) without deleting the entry. Strict JSON cannot express comments. Parsing with JSON5 unlocks that authoring workflow while remaining a superset of today's valid decks.

## What Changes

- Load deck config files with a JSON5 parser instead of `JSON.parse` (comments, trailing commas, and other JSON5 syntax allowed; strict JSON remains valid).
- Introduce a single module as the entry point for reading and writing deck config files so parse/format stay centralized for future changes.
- Route existing load and write call sites (`loadDeckFile`, `hptx new slide`, `hptx new deck`) through that module.
- Writes continue to emit strict JSON via `JSON.stringify` (pretty-printed); comment preservation on rewrite is explicitly out of scope.
- Add the `json5` package dependency.
- Document that `deck.json` may use JSON5 syntax.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deck-config`: Require JSON5 parsing of the deck file (superset of JSON); clarify that post-parse validation still expects a plain object with the same field contract; document that platform writes of the deck file use strict JSON and need not preserve comments or other JSON5-only source syntax.
- `slide-generator`: Require deck-file updates and new-deck scaffolds to read/write the deck config through the shared deck-file I/O entry (behavior of written content stays strict JSON).

## Impact

- Platform tooling only (assemble config load, generate write paths); no shell runtime change.
- Existing strict-JSON `deck.json` files keep working (JSON5 is a JSON superset).
- Migration: none required; authors may optionally add comments / trailing commas.
- New dependency: `json5`.
- Filename stays `deck.json` (no rename to `.json5`).
