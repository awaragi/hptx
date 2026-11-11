# Spec Delta

## MODIFIED Requirements

### Requirement: Reload on edits
While preview is running, saving a selected slide file, the resolved deck JSON file (when one is loaded), a local theme file, or a local image file previously discovered for baking from the current assemble set MUST trigger a full page reload with the re-assembled deck.

#### Scenario: Edit slide HTML refreshes preview
- **WHEN** preview is running for `--slide metrics` and the author saves `metrics.html`
- **THEN** the preview reloads and reflects the saved content

#### Scenario: Edit baked image refreshes preview
- **WHEN** preview is running for a slide that baked `assets/logo.png` and the author saves that image file
- **THEN** the preview reloads with the updated baked asset
