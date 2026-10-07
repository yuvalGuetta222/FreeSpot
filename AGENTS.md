<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FreeSpot Project Instructions

This repository is the FreeSpot project.

Before starting any task, read `PROJECT_CONTEXT.md` if it exists.
Use it as the source of truth for the current product state, architecture,
business logic, database decisions, and previous development work.

## Working method

We always work on ONE focused task at a time.

Workflow:

Task → focused change → testing → QA → commit → next task.

Do not implement several features or unrelated changes at the same time
unless explicitly requested.

## Before making changes

1. Understand the requested task.
2. Inspect only the files relevant to that task.
3. Briefly explain which files you intend to modify.
4. Do not modify unrelated files.
5. Do not perform large refactors unless explicitly requested.

## FreeSpot architecture

- FreeSpot has separate Customer and Business experiences.
- Preserve the separation between Customer and Business routes and logic.
- The project uses Next.js, TypeScript and Supabase.
- Be especially careful with:
  - Supabase Auth
  - RLS policies
  - RPC/database functions
  - database permissions
  - appointment booking logic
  - business services
  - favorites

Prefer database/server-side enforcement for security-sensitive logic instead
of relying only on client-side validation.

## After every change

Always provide:

1. A short summary of exactly what changed.
2. The files that were modified.
3. A clear QA checklist for testing the change.

Wait for QA before starting the next task.

## Git rules

Do not run:

- git commit
- git push
- destructive git commands

unless I explicitly ask you to.

## Communication

You can communicate with me in Hebrew.

Keep technical names such as file names, functions, routes, database tables,
columns and code identifiers exactly as they appear in the project.
