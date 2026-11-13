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
