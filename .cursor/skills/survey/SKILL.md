---
name: survey
description: Scan repo, extract key concepts into .cursor/, update mode via git diffs.
---

# Survey

Scans the project repository and populates `.cursor/` with domain knowledge — notes, glossary entries, and documentation extracted from the codebase.

## Behavior

### Initial survey (no existing knowledge)

1. Scan project structure: directories, build files, entry points, README, CI config.
2. Identify key domain concepts, modules, and boundaries.
3. For each concept:
   - Create a glossary entry in `.cursor/glossary/` if it defines a domain term.
   - Create a note in `.cursor/notes/` if it captures a pattern, convention, or decision.
   - Create a doc in `.cursor/docs/` if it warrants long-form reference.
4. Update `.index.mdc` for every directory that received new files.

### Update mode (existing knowledge + git diffs)

1. Run `git diff` against the last surveyed commit (stored in `.cursor/notes/survey-state.md`).
2. For changed files, re-extract concepts.
3. Update existing entries or create new ones. Never delete user-written content.
4. Update survey-state with the current commit hash.

## Constraints

- **Non-destructive.** Never overwrite user-written content. Append or create new files.
- **Idempotent.** Running twice on the same commit produces no changes.
- **Scope:** reads the project repo, writes only to `.cursor/`.

