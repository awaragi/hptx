# Spec Delta

## MODIFIED Requirements

### Requirement: Build prints effective configuration
Before writing output, `npm run build` MUST print the effective configuration (working root, deck file path or none, version, title, brand, caption, output, cover, theme, slides or `--slide` filter, scripts, styles) so the operator can see the merged values for this run. Filesystem paths in that summary and in the success line that names the written `output` MUST follow the CLI console path display rules (shorter of invocation-relative vs `<cwd>/…`, absolute when more than `../../` is required).

#### Scenario: Config summary before write
- **WHEN** the user runs `npm run build -- --cwd /path/to/deck`
- **THEN** the command prints an effective-configuration summary that includes the working root and output path before writing the HTML file

#### Scenario: Summary paths use compact display
- **WHEN** the user runs build with `--cwd templates` from a parent invocation directory
- **THEN** filesystem paths in the summary use the shorter of invocation-relative and `<cwd>/…` forms (or absolute when both need more than `../../`)
