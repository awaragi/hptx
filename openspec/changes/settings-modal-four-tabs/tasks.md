# Tasks

## 1. Shell Settings markup and tab wiring

- [x] 1.1 In `shell/template.html`, reduce the tablist to Theme / Slides / Playback / Reset (`data-tc-tab` `theme` | `slides` | `playback` | `reset`); merge Generate and bake Instructions field blocks into the Theme panel as stacked sections (Apply → Generate → Bake); rename the former Navigation panel/tab to Playback; drop orphan prompt/delivery panels; update `tcPanels` / default tab key; keep control element ids. Verify by opening Settings in `npx hptx dev` (or inspecting markup) that only four tabs exist and Theme shows all three sections.
- [x] 1.2 Shorten the Settings header blurb so it no longer tells users to switch to Generate theme / Instructions tabs; verify the copy matches the single Theme tab.
- [x] 1.3 Adjust Theme panel CSS only if stacked sections clip or feel unusable (scroll / textarea flex); verify Theme panel scrolls and Apply / Copy / Clear still work.
## 2. Docs and verification

- [x] 2.1 Update README Settings paths (Navigation → Playback; Generate theme / Instructions under Theme) and verify those sections read correctly.
- [x] 2.2 Add or extend a Vitest assemble/shell assertion that the Settings tablist labels are Theme, Slides, Playback, Reset (and that Generate theme / Instructions are not top-level tabs); run the focused test and confirm it passes.

## Workflow follow-up

- Archive the change after review (`/opsx-archive`).
