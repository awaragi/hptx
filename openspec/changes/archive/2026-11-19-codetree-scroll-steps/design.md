# Design

## Context

`codeTree` already maps each file to one shell step (`stepCount = files.length`) and resets `scrollTop` on paint. Overflow is scrollable by mouse/trackpad only. See proposal.md for motivation; the new `slide-templates` requirement defines the staged-scroll behavior.

## Goals / Non-Goals

**Goals:**

- Flatten navigation into (fileIndex, pageIndex) stages driven by shell ←/→.
- Measure overflow from the live code pane after paint/highlight; one step ≈ one `clientHeight` page.
- Tree click jumps to that file’s page 0; export continues to capture each step.

**Non-Goals:**

- Shell/engine API changes.
- Smooth scroll animation (instant `scrollTop` is enough).
- Author-declared page counts in JSON.
- Syncing manual scrollbar drags back into the shell step index.

## Decisions

1. **Stage model**  
   Build an array of stages `{ file, page }` after loading a file’s content and measuring the wrap. Page 0 is top; pages `1..n-1` set `scrollTop = page * clientHeight` (clamp to max). `stepCount` = total stages across all files. Recompute pages when painting a new file (and on theme refresh if layout can change).

2. **Lazy page count per file**  
   Do not precompute every file’s page count before first visit—highlighting and fonts can change height. On first paint of a file (or whenever content is (re)loaded), measure `scrollHeight` / `clientHeight`, ceil pages (minimum 1), and rebuild the global stage list while preserving the current file’s identity as best as possible (map current stage to the same file’s nearest page). Simpler first cut: rebuild stages for all files by temporarily loading each (expensive) OR only expand the current file’s pages once measured and treat unmeasured files as 1 page until visited. Prefer **expand-on-measure for the current file**, keeping other files as 1 page until opened—then splice in their pages when measured and ask the shell to stay on the logical stage via `D.setStep` only when needed. Even simpler for a template: **on boot and whenever showing a file, after highlight, measure that file; maintain `pagesByFile[i]`; `stepCount` = sum of pages; map global step ↔ (file, page)**. When pages for a file grow after measure, update `this.stepCount` (shell reads `stepCount` as function or number each navigation—contract allows function).

3. **`stepCount` as function**  
   Use `stepCount: function () { return totalStages(); }` so the shell always sees the latest sum after measurement.

4. **Tree click**  
   Jump to the global step for `(fileIndex, 0)`, not the old file-only index.

5. **Copy**  
   Update slide-sub / notes to say ←/→ pages long code, then moves to the next file.

## Risks / Trade-offs

- **[Risk] stepCount grows mid-slide after first measure** → Use functional `stepCount`; after measuring, if the shell’s current index is past the new count, clamp via `setStep`. Prefer measuring during `setStep`/`paint` before returning.
- **[Risk] Fractional last page** → Last page clamps `scrollTop` to max; still counts as its own step so export shows the bottom.
- **[Risk] Manual scroll desync** → Accept; next ←/→ re-applies the step’s `scrollTop`.

## Migration Plan

Template-only update. Existing decks with a copied `codeTree.html` keep old behavior until re-generated from the template. No config migration.
