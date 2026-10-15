# Copilot Agent Rules

## Terminal
- NEVER run any terminal command without my explicit permission in the current message.
- This includes: npm/yarn/pnpm, node, git, build, test, lint, install, and any shell command.
- If you think a command is needed — ASK FIRST, do not run it.

## Versions & Environment
- If you need the Node.js or npm version — ASK ME. Do not guess, do not run `node -v` or `npm -v`.
- For dependency versions, read ONLY the `dependencies` and `devDependencies` fields in `package.json`.
- Do NOT read `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, or `node_modules`.

## Scope of Work
- Do ONLY what I explicitly asked in the current message.
- Do NOT do any of the following unless I explicitly ask in that message:
  - write or run tests
  - run linters, formatters, type checkers
  - build the project
  - run any git command (commit, push, checkout, reset, etc.)
  - install or update dependencies
  - refactor unrelated code
  - add comments, docs, or type annotations I didn't ask for
  - read files outside the ones needed for the task

## Files
- Never read or reference `node_modules/`, `dist/`, `build/`, `.next/`, `coverage/`, or any generated/vendor directory.
- If you need context from a file I didn't mention — ask me first.

## Response Style
- If a task looks ambiguous — ask one clarifying question instead of guessing.
- Do not summarize what you did unless I ask.