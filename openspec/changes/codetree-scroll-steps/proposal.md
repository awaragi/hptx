# Proposal

## Why

On `codeTree`, ←/→ currently jumps file-by-file. Long snippets that overflow the pane are easy to miss unless the presenter scrolls manually. Staging overflow as extra shell steps lets → page through the code before the next file, which matches how presenters already walk other stepped slides.

## What Changes

- Update the `codeTree` template so shell steps are a flat sequence of (file, scroll-page) stages: overflow snippets get one step per code-pane page; short snippets stay a single step.
- → advances scroll within the current file before opening the next file; ← reverses that order. Tree click lands on that file’s first page (top).
- Refresh copy / notes so authors know ←/→ pages long code.
- Extend the `slide-templates` spec with the scroll-staging behavior.

This is **deck content** (template behavior). No shell API changes. Authors who already copied `codeTree` into a deck keep the old step model until they re-copy or manually adopt the new script.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `slide-templates`: Require `codeTree` to stage long overflowing snippets as multiple shell steps (scroll pages) before advancing to the next file.

## Impact

- Files: `templates/codeTree.html` (and catalog description if wording changes).
- Export: more PNG/PDF/PPTX frames when a deck uses `codeTree` with tall snippets (one frame per scroll page).
- No assemble/shell changes; no new CDN deps.
