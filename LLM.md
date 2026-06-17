# api

Indexer and API serving offchain features for the LuxDAO app (proposals, comments, temperature checks, SIWE auth).

## Packages
- `packages/ponder/` — [Ponder](https://github.com/ponder-sh/ponder) indexer for contracts/events: `KeyValuePairs`, `FractalRegistry` (legacy), `ModuleProxyFactory`.
- `packages/offchain/` — API for DAO info, proposals, comments, temperature checks, and SIWE authentication.

## Build
- `Dockerfile` (plus `Dockerfile.simple`, `Dockerfile.fixed` variants).

Full docs: README.md
