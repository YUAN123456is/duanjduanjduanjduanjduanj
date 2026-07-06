---
name: Expo API client base URL
description: Expo apps must call setBaseUrl explicitly since they bypass the shared reverse proxy that other artifacts rely on for relative URLs.
---

The shared reverse proxy (`localhost:80/<path>`) that lets other artifacts use relative URLs to reach each other does NOT cover Expo apps — Expo is accessed directly via `$REPLIT_EXPO_DEV_DOMAIN`, bypassing the proxy entirely.

**Why:** without an explicit base URL, generated API hooks (`@workspace/api-client-react` or similar Orval output) default to relative paths that resolve against the Expo dev server's own origin, not the API server, causing every request to 404.

**How to apply:** in the Expo app's root layout (e.g. `app/_layout.tsx`), call the client's `setBaseUrl` at module top level using an `EXPO_PUBLIC_*` env var pointing at the API server's public domain, before any component mounts or fires a query.
