---
name: Express static-vs-dynamic route ordering and React hooks-order with early returns
description: Two related "silent shadowing" bugs found via e2e testing — Express :param routes swallowing static sibling routes, and React hooks declared after early loading/error returns.
---

**Express routing:** when a router has both a static path and a dynamic `:param` path under the same prefix (e.g. `GET /dramas/playback` and `GET /dramas/:dramaId`), Express matches routes in registration order. If the `:param` route is registered first, a request to the static path gets swallowed — `:dramaId` binds to the literal string (e.g. `"playback"`) and the handler queries the DB with that bogus value, usually surfacing as a confusing 500/DB error rather than an obvious 404.

**Why:** this only shows up at request time, not at typecheck time, and the error message (a failed DB query with a weird param) doesn't obviously point to route ordering.

**How to apply:** always register more specific static routes before dynamic `:param` routes on the same prefix. When adding a new static sub-route to an existing resource router, grep for existing `:param` routes on that resource first.

**React hooks:** a component that calls `useState`/`useQuery` etc., then does an early `if (isLoading) return ...`, must declare ALL of its hooks (including `useRef`) before that early return. Hooks declared textually after the early return only run once loading finishes, so the hook count/order differs between the loading render and the loaded render, triggering React's "change in the order of Hooks" error — which manifests as a full error-boundary crash on first successful data load, not a lint-time failure.

**How to apply:** in any component with a loading/error early return, move every hook call (useState, useRef, useEffect, custom hooks) above the early-return block, even ones only logically needed by the "loaded" render path.
