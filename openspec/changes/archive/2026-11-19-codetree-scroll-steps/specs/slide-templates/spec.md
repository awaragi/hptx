# Spec Delta

## ADDED Requirements

### Requirement: Code tree stages long snippets
When a `codeTree` file’s snippet is taller than the code pane, the template MUST expose additional shell steps that page the pane (about one viewport each) before advancing to the next file. Files that fit in one viewport MUST remain a single step. Pressing → MUST move to the next scroll page of the current file when any remain, otherwise open the next file at its first page. Pressing ← MUST reverse that order. Selecting a file in the tree MUST open that file at its first page (top of the pane).

#### Scenario: Overflow becomes scroll steps
- **WHEN** the active `codeTree` file’s snippet overflows the code pane and the presenter presses →
- **THEN** the code pane scrolls to the next page of that file and the highlighted tree file does not change

#### Scenario: Last page advances to next file
- **WHEN** the presenter is on the last scroll page of a `codeTree` file and presses →
- **THEN** the next file opens at the top of the code pane

#### Scenario: Tree click lands at top
- **WHEN** the presenter clicks a file in the `codeTree` tree
- **THEN** that file is shown at its first scroll page (code pane scrolled to the top)
