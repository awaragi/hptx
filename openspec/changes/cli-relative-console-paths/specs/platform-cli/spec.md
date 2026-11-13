# Spec Delta

## ADDED Requirements

### Requirement: CLI console path display
Operator-facing CLI console output that names filesystem paths (effective-configuration summaries, export artifact summaries, and success “Wrote …” lines) MUST format those paths per the scenarios below. Path resolution and on-disk locations MUST NOT change. Non-path values MUST print unchanged.

#### Scenario: Prefer shorter of invocation-relative and cwd token
- **WHEN** the invocation directory is `/proj`, the working root is `/proj/templates`, and the CLI prints `/proj/templates/deck.json`
- **THEN** it prints `<cwd>/deck.json` (shorter than `templates/deck.json`)

#### Scenario: Prefer invocation-relative when shorter
- **WHEN** the invocation directory is `/proj`, the working root is `/proj/templates`, and the CLI prints `/proj/dist/templates.html`
- **THEN** it prints `dist/templates.html` (shorter than `<cwd>/../dist/templates.html`)

#### Scenario: Cwd line relative when shallow
- **WHEN** the invocation directory is `/proj` and the working root is `/proj/templates`
- **THEN** the effective-configuration `cwd` line shows `templates` (or `.` when they are the same directory)

#### Scenario: Absolute when more than two parent hops
- **WHEN** every compact candidate for a path would require more than two leading `..` segments (more than `../../`)
- **THEN** the CLI prints the absolute path

#### Scenario: Root path is cwd token alone
- **WHEN** a printed path is exactly the working root and the `<cwd>` candidate wins
- **THEN** it shows `<cwd>` with no trailing slash segment

#### Scenario: Non-paths unchanged
- **WHEN** effective configuration includes title text and an `https://` script URL
- **THEN** those values print unchanged (no `<cwd>/` prefix)
