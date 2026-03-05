---
name: bootstrap
description: Create/verify .cursor structure (project-agnostic).
---

# Bootstrap

Idempotent, non-destructive `.cursor/` structure validator.

## Behavior

1. Create missing directories: `rules`, `guide`, `docs`, `notes`, `contracts`, `security-cases`, `glossary`, `skills`.
2. Create missing `.index.mdc` in every directory (use the Index template from `.cursor/kombucha.mdc`). List existing direct children; empty sections when directory is empty.
3. Create `meta.mdc` if absent (use §Meta from `.cursor/kombucha.mdc`).
4. If the project references external repositories, suggest creating a `.code-workspace` file for a multi-root workspace (see Workspace locality in `meta.mdc`).
5. **Never** overwrite existing files or content.
6. **Never** scan the project repo for domain knowledge.
7. **Do not** update existing indexes — use `/index-integrity` for that (`.cursor/skills/index-integrity/SKILL.md`).
8. **Report** inconsistencies; do not auto-fix content.

Safe to run repeatedly. Zero destructive changes.

