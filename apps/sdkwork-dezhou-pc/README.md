# SDKWork Dezhou PC

PC browser application root for SDKWork Texas Hold'em table lobby.

## Structure

- `packages/sdkwork-dezhou-pc-core` — shared runtime (stores, SDK inventory, table service)
- `packages/sdkwork-dezhou-pc-commons` — shared UI primitives
- `packages/sdkwork-dezhou-pc-shell` — route/view composition shell
- `packages/sdkwork-dezhou-pc-dashboard` — table lobby and profile pages
- `src/bootstrap/` — environment, IAM runtime, SDK clients, providers

Package names follow `APP_PC_ARCHITECTURE_SPEC.md`: `sdkwork-dezhou-pc-*`.

## Run locally

From the repository root:

```bash
pnpm dev
```

From this directory:

```bash
pnpm install
pnpm dev
```

The dev server listens on port 3001.

## Standards

- Architecture: `../../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`
- UI: `../../../sdkwork-specs/APP_PC_REACT_UI_SPEC.md`
- IAM: `../../../sdkwork-specs/IAM_LOGIN_INTEGRATION_SPEC.md`
- Manifest: `agent.app.config.json`
