---
name: Base-path-relative static asset references
description: Root-relative asset paths (favicon, images, CSS url()) 404 under the shared proxy's per-artifact path prefix; use Vite's base-aware alternatives instead.
---

Root-relative paths like `href="/favicon.svg"` or `src="/images/foo.png"` break in this workspace because each artifact is served under a path prefix (e.g. `/landing/`) by the shared proxy, but a root-relative path resolves against the domain root, not the artifact's base.

**Why:** Discovered when a DESIGN-subagent-built landing page had all its hero/poster images 404 because JSX used absolute `/images/...` src/background paths, and the HTML `<link rel="icon">` used `/favicon.svg` — both bypassed Vite's configured `base`.

**How to apply:**
- In `index.html`: use Vite's `%BASE_URL%` placeholder, e.g. `<link rel="icon" href="%BASE_URL%favicon.svg" />`. Vite substitutes it with the configured base at build/serve time.
- In app code (JSX `src`, inline style `backgroundImage`, CSS-in-JS `url()`): use `` `${import.meta.env.BASE_URL}images/foo.png` `` instead of `/images/foo.png`.
- After generating or receiving UI code from a subagent, grep for `src="/`, `url('/`, `href="/` patterns across the artifact's `src/` and `index.html` before trusting it — this class of bug doesn't show up in typecheck, only at runtime as 404s.
