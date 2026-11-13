# Spec Delta

## MODIFIED Requirements

### Requirement: Export help and effective configuration
`hptx export --help` MUST document `--cwd`, `--deck`, `--slide`, `--output`, `--format`, `--theme` (`light|dark`), `--progress`, and other shared deck field flags that export accepts. Before capturing, export MUST print an effective-configuration style summary including format, appearance theme, presentation name, and output artifact path(s). Filesystem paths in the shared effective-configuration block, the export artifact summary, and post-capture “Wrote …” lines MUST follow the CLI console path display rules (shorter of invocation-relative vs `<cwd>/…`, absolute when more than `../../` is required).

#### Scenario: Help lists format and theme
- **WHEN** a developer runs `npx hptx export --help`
- **THEN** the help text names `--format`, `--theme light|dark`, and `--progress`

#### Scenario: Artifact paths use compact display
- **WHEN** export prints its artifact summary and a “Wrote …” line for filesystem paths
- **THEN** those paths use the shorter of invocation-relative and `<cwd>/…` forms (or absolute when both need more than `../../`)
