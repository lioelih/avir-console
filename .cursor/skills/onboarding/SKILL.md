---
name: onboarding
description: Teach newcomers the repo purpose, architecture, build/test flows, and safe change zones.
---

# Onboarding

Read-only skill that explains the project to a newcomer — human or agent.

## Behavior

1. Read `.cursor/meta.mdc` for FSC structure and development discipline.
2. Scan the project root for build files, README, CI config, and entry points.
3. Present a structured overview:
   - **Purpose** — what the project does and who it serves.
   - **Architecture** — major components, boundaries, data flows.
   - **Build & test** — how to build, run, and test. Which commands, which configs.
   - **Safe change zones** — where a newcomer can make changes without risk (tests, docs, non-critical modules).
   - **Danger zones** — core modules, security-sensitive areas, shared interfaces.
4. Reference relevant `.cursor/docs/`, `.cursor/notes/`, and `.cursor/glossary/` entries.

## Constraints

- **Read-only.** Does not create or modify files.
- **No assumptions.** If information is missing, say so.
- **Idempotent.** Safe to invoke repeatedly.

