---
name: index-integrity
description: Scan, validate, and enforce .index.mdc compliance across .cursor/.
---

# Index Integrity

Scans every directory under `.cursor/`, validates its `.index.mdc` against the index rules (`.cursor/meta.mdc`), and enforces compliance by creating missing indexes and fixing stale ones.

Unlike bootstrap (which only **creates** missing indexes and never touches existing ones), index-integrity **reads the filesystem and reconciles** — adding missing entries, removing stale entries, and creating absent indexes.

## When to invoke

- After adding, removing, or renaming files or directories under `.cursor/`.
- After bulk operations (new system files, new case studies, directory restructures).
- As a periodic hygiene pass.
- When bootstrap reports inconsistencies but doesn't fix them.

## Index rules (from `meta.mdc`)

1. Every `.cursor/` directory contains a `.index.mdc` (hidden file).
2. Indexes list **only** direct children — shallow, no nested trees.
3. Each entry = name + one-line description. Unix directory listing with agentic metadata.
4. Empty directory → index with empty Directories and Files sections.
5. File add/remove/rename → parent `.index.mdc` must reflect the change.

## Behavior

### Phase 1 — Scan

1. Recursively list every directory under `.cursor/`.
2. For each directory, list its direct children (files and subdirectories).
3. For each directory, read its `.index.mdc` (if it exists).

### Phase 2 — Validate

For each directory, check:

| Check | Pass condition | Fail condition |
|-------|---------------|----------------|
| **Exists** | `.index.mdc` is present. | Missing → flag for creation. |
| **Structure** | Has `# Index`, `## Directories`, `## Files` sections. | Malformed → flag for rewrite. |
| **Shallow** | Lists only direct children, not nested. | Nested trees → flag as non-shallow. |
| **Complete** | Every direct child has an entry. | Missing entry → flag for addition. |
| **Accurate** | Every entry corresponds to an existing child. | Stale entry → flag for removal. |
| **Descriptions** | Every entry has a non-empty description after `—`. | Empty description → flag for generation. |

### Phase 3 — Report

Print a summary before making changes.

### Phase 4 — Enforce

| Issue | Action |
|-------|--------|
| **Missing index** | Create from Index template. Populate with current children. |
| **Malformed index** | Rewrite with correct structure. Preserve valid entries. |
| **Missing entry** | Add entry. Generate description from file heading / frontmatter. |
| **Stale entry** | Remove. |
| **Empty description** | Generate from file content. |

### Description generation heuristic

1. Frontmatter `description` field → use it.
2. First `#` heading subtitle/tagline → use it.
3. Directories → read child `.index.mdc` purpose. Fallback: "contains N files."
4. Fallback → humanized filename.

One short sentence or phrase. No period. Match existing terse style.

## Constraints

- **Never delete files or directories.** Only modify `.index.mdc` files.
- **Preserve user-written descriptions** if valid.
- **Idempotent.** Second run = no changes.
- **Scope: `.cursor/` only.**

