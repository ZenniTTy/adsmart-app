# AdSmart

Open-source Claude Desktop extension (`.mcpb`) that lets users manage their own Google Ads accounts through chat. Runs 100% locally on the user's machine, uses the user's own Google Cloud project and service account, and has no hosted components.

## Stack

- TypeScript (strict), ESM, Node.js 20+ runtime (Claude Desktop ships Node, so users install nothing)
- Bun for package management, scripts and tests
- Biome for lint and format
- Google Ads REST API (latest version) with `google-auth-library` for service account auth
- MCP TypeScript SDK over stdio, packaged as MCPB

## Commands

```bash
bun install
bun run check      # lint + typecheck + test, must pass before any commit
bun run format     # auto-fix formatting and imports
bun run test
```

## Repository layout

- `src/` server source
- `tests/` automated tests
- `docs/` end-user guides in Portuguese (keep them in sync with behavior)

## Product rules (non-negotiable)

- Every write to a Google Ads account goes through: preview (`validateOnly: true` plus current values snapshot) → explicit user approval → apply → local audit record. No tool may mutate an account in a single step.
- New campaigns, ad groups and ads are created `PAUSED`.
- Prefer pausing over removing. Removals must be explicitly requested and flagged as irreversible.
- Customer IDs are sent without dashes.
- Service account keys, access tokens and any secret must never appear in logs, errors, tool results or test fixtures.
- The only network hosts allowed are `googleads.googleapis.com` and `oauth2.googleapis.com`.
- User-facing tool output and messages are in Portuguese (pt-BR).

## Engineering conventions

- Never add comments to code. Names must carry the intent.
- No `any`. Validate external input (tool arguments, API responses) at the boundary.
- Before adding or upgrading a dependency or using a library API, check current documentation with Context7. Do not rely on memory for Google Ads API fields, versions or MCP SDK APIs.
- Tests must never call the real Google Ads API. Mock HTTP at the boundary.
- Small, thematic commits following Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`).
- Branch from `develop`. `main` only receives releases.
- Update `CHANGELOG.md` under `[Não lançado]` for user-visible changes.
- Keep the repository user-focused: no internal planning notes, decision logs or scratch files.

## Definition of done

1. `bun run check` passes.
2. Behavior covered by tests.
3. User docs in `docs/` updated when behavior changes.
4. No secrets or real account data in the diff.
