---
name: Artifact workflow naming
description: The registered workflow name for an artifact's service is not the same as the artifact slug — always resolve it before calling restart_workflow.
---

Calling `restart_workflow` (or `restartWorkflow`) with just the artifact slug (e.g. `"mobile"` or `"expo"`) fails with `RUN_COMMAND_NOT_FOUND` even when the artifact exists and its `artifact.toml` defines a service with that name. The actual registered workflow name includes the artifact path prefix, e.g. `artifacts/mobile: expo` (format: `artifacts/<slug>: <service name from artifact.toml>`).

**How to apply:** If a `restart_workflow` call on a newly created or unfamiliar artifact fails with "run command doesn't exist in config", call `listWorkflows()` (from the workflows skill) to get the exact registered name before retrying, rather than guessing variations of the slug/service name.
