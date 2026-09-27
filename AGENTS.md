# AdSmart

Open-source Claude Desktop extension (`.mcpb`) that lets users manage their own Google Ads accounts through chat. Runs 100% locally on the user's machine, uses the user's own Google Cloud project and service account, and has no hosted components.

This file is the single source of instructions for AI coding agents (Claude Code, Codex, Cursor and others). `CLAUDE.md` only imports it. Human contributors should read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## Stack

- TypeScript (strict), ESM, Node.js 22+ runtime (Claude Desktop ships Node, so users install nothing)
- Bun for package management, scripts and tests (version pinned in `.bun-version`)
- Biome for lint and format
- Google Ads REST API (latest version) with `google-auth-library` for service account auth
- MCP TypeScript SDK over stdio, packaged as MCPB
- lefthook + commitlint enforce lint, typecheck and Conventional Commits on every commit

## Commands

```bash
bun install
bunx lefthook install   # once per clone: activates the git hooks
bun run check      # lint + typecheck + unit tests with coverage floor + E2E; must pass before any commit
bun run format     # auto-fix formatting and imports
bun run test       # unit tests only
bun run e2e        # builds the server and runs the end-to-end tests over stdio
```

## Repository layout

- `src/main.ts` production entrypoint; `src/server.ts` registers the MCP tools
- `src/google/` authentication, Google Ads API client and error translation
- `src/tools/` one module per MCP tool family (read-only queries and account changes)
- `src/changes/` change pipeline: item schemas, preview, apply, undo and local history
- `tests/unit/` unit tests; `tests/e2e/` end-to-end tests against a fake Google Ads HTTP server
- `docs/` end-user guides in Portuguese (keep them in sync with behavior)

## Product rules (non-negotiable)

- Every write to a Google Ads account goes through: preview (`validateOnly: true` plus current values snapshot) → explicit user approval → apply → local audit record. No tool may mutate an account in a single step. Explicit approval is the user's confirmation in the chat after seeing the preview; the Claude Desktop permission dialog is complementary, because users may choose "Always allow".
- New campaigns, ad groups and ads are created `PAUSED`.
- Prefer pausing over removing. Removals must be explicitly requested and flagged as irreversible.
- Customer IDs are sent without dashes.
- Service account keys, access tokens and any secret must never appear in logs, errors, tool results or test fixtures.
- The only network hosts allowed are `googleads.googleapis.com` and `oauth2.googleapis.com`.
- User-facing tool output and messages are in Portuguese (pt-BR).

## Engineering conventions

- Never add comments to code. Names must carry the intent.
- No `any`. Validate external input (tool arguments, API responses) at the boundary.
- Never write to stdout in the server: stdout is the MCP protocol channel. Diagnostics go to stderr.
- Before adding or upgrading a dependency or using a library API, check current documentation (for example with Context7). Do not rely on memory for Google Ads API fields, versions or MCP SDK APIs.
- Tests must never call the real Google Ads API. Mock HTTP at the boundary.
- Never read or print service account key files or the user's `~/.adsmart/` directory.
- Small, thematic commits following Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `ci`).
- Branch from `develop` and open pull requests against `develop`. `main` only receives releases.
- Update `CHANGELOG.md` under `[Não lançado]` for user-visible changes.
- Keep the repository user-focused: no internal planning notes, decision logs or scratch files.

## Acceptance criteria

Before implementing a non-trivial feature, propose acceptance criteria with IDs (for example `AUTH-01`) in the issue or pull request. Implementation starts after a maintainer agrees with the list. Test names reference the IDs, and `tests/unit/invariants.test.ts` holds the security invariants that must keep passing.

## Agent guardrails

`.claude/settings.json` registers hooks (they need `jq`) that block reading key files and `.env` files, writing secrets, destructive shell commands, and that format edited TypeScript with Biome. They are a safety net, not a substitute for the rules above. Never bypass them.

## Definition of done

1. `bun run check` passes.
2. Behavior covered by tests.
3. User docs in `docs/` updated when behavior changes.
4. No secrets or real account data in the diff.
