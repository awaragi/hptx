# Spec Delta

## ADDED Requirements

### Requirement: Local relative images are rewritten at assemble
Slide and cover documents MAY reference local image files with relative paths in `<img src>`, `<source src>`, and CSS `url(...)`. Assemble MUST bake those references per `slide-local-images` so the harvested output does not retain filesystem-relative image URLs for those locals.

#### Scenario: Harvested output has no local img src
- **WHEN** a slide body contains `<img src="photo.png">` and `photo.png` exists beside the slide
- **THEN** the assembled slide markup uses `data-asset` for that image instead of `src="photo.png"`
