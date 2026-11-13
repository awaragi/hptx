# platform-cli Specification

## Purpose

Defines the local package CLI front-end: a private-package `hptx` binary with `build`, `dev`, and `new` subcommands for in-repo use via `npx` / `node_modules/.bin` without an npm registry publish.

## Requirements

### Requirement: Private package exposes hptx bin
The package MUST remain `"private": true` and MUST declare a `bin` named `hptx` that invokes the platform CLI. After a normal local `npm install`, `npx hptx` (or `node_modules/.bin/hptx`) MUST run that CLI.

#### Scenario: npx hptx shows help
- **WHEN** a developer runs `npx hptx --help` from the package root after `npm install`
- **THEN** the process exits successfully and prints usage that names the `build`, `dev`, and `new` subcommands

#### Scenario: Package stays private
- **WHEN** `package.json` is inspected
- **THEN** `"private"` is `true` and a `bin` entry named `hptx` is present

### Requirement: Top-level subcommands build, dev, and new
The `hptx` binary MUST accept subcommands `build`, `dev`, `new`, and `export`. Flags after the subcommand MUST be parsed with the same semantics as today’s corresponding `npm run build|dev|new` scripts (including `new deck` / `new slide` / `--list`) for those commands, and with export’s documented flags for `export`. Authors MUST NOT need an extra `--` between `hptx` and those flags when invoking via `npx hptx`.

#### Scenario: Build via bin without npm-run separator
- **WHEN** a developer runs `npx hptx build --cwd templates` (or an equivalent valid deck invocation)
- **THEN** build runs with those flags and does not require a `--` token between `build` and `--cwd`

#### Scenario: Dev via bin
- **WHEN** a developer runs `npx hptx dev --cwd templates`
- **THEN** preview starts with the same working-root / deck resolution rules as `npm run dev -- --cwd templates`

#### Scenario: New via bin
- **WHEN** a developer runs `npx hptx new --list`
- **THEN** the template list is printed the same way as `npm run new -- --list`

#### Scenario: Export via bin
- **WHEN** a developer runs `npx hptx export --cwd templates --format png` (or an equivalent valid deck invocation)
- **THEN** export runs with those flags and does not require a `--` token between `export` and `--cwd`

### Requirement: npm run scripts remain equivalent wrappers
`npm run build`, `npm run dev`, `npm run new`, and `npm run export` MUST continue to work and MUST invoke the same CLI behavior as `npx hptx build|dev|new|export` (still requiring npm’s `--` before script args when using `npm run`).

#### Scenario: npm run build still works
- **WHEN** a developer runs `npm run build -- --cwd templates` with a valid deck that has `output`
- **THEN** build succeeds equivalently to `npx hptx build --cwd templates`

#### Scenario: npm run export still works
- **WHEN** a developer runs `npm run export -- --cwd templates --format png` with a valid deck that has `output` and system Chrome available
- **THEN** export succeeds equivalently to `npx hptx export --cwd templates --format png`

### Requirement: Root help lists export
Root `npx hptx --help` MUST list the `export` subcommand alongside `build`, `dev`, and `new`.

#### Scenario: npx hptx shows export in help
- **WHEN** a developer runs `npx hptx --help` from the package root after `npm install`
- **THEN** the process exits successfully and prints usage that names the `build`, `dev`, `new`, and `export` subcommands

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
