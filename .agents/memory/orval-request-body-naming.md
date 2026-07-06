---
name: Orval request body schema naming
description: Why a component schema referenced as an operation's requestBody gets a different generated zod/type name than you expect.
---

When an OpenAPI `requestBody` uses `$ref` to a named `components/schemas` entry, Orval still generates the runtime zod export (and often the inferred type) using the pattern `<operationId>Body`, not the referenced schema's own name — even though the TS *type* alias for the referenced schema name also gets exported separately.

**Why:** Orval derives request-body identifiers from the operation, not the schema ref, to keep per-operation body types distinct even when multiple operations share a schema. This caused a same-name collision (`SetWatchProgressBody` was both my explicit component schema name and Orval's auto-derived body export), producing a duplicate-export TS error at build time.

**How to apply:**
- Never name a `requestBody` component schema `<operationId>Body` — Orval will generate that exact name itself and collide with it.
- After codegen, import the zod value using the `<operationId>Body` name (e.g. `SetWatchProgressBody`) for `.safeParse()` in route handlers — not the component schema's own name, which may only be exported as a TS type, not a runtime value.
- Verify actual generated export names with a grep on `lib/api-zod/src/generated/api.ts` before wiring route handlers, rather than assuming the component schema name is the runtime export.
