# DramaVerse

A short-drama (micro-drama) streaming app for mobile — vertical swipe-through episode feed, ad-based episode unlocks (100% IAA, zero IAP), and compliance-ready onboarding/login/profile flows for overseas app store submission.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile` — the Expo mobile app (DramaVerse). Now wired to the real backend via `@workspace/api-client-react` hooks (drama list, playback/unlock state, user registration, favorites, watch-progress); no longer uses mock data for content or local-only progress. Local AsyncStorage is still used for `deviceId` persistence only.
- `artifacts/mobile/data/mock.ts` — legacy mock drama/episode dataset, no longer imported anywhere; kept only for reference.
- `artifacts/mobile/context/` — AuthContext (onboarding/ATT + sign-in state, registers device via `useRegisterUser`) and DramaContext (server-backed favorites + watch-progress, keyed by `userId`; unlock state is separately server-computed via drama playback endpoint)
- `artifacts/mobile/constants/colors.ts` — brand palette (see Architecture decisions for exact values)
- `artifacts/api-server` — real Express API backing both the mobile app and admin panel (dramas/episodes/users/unlocks/global config routes, Postgres + Drizzle)
- `artifacts/admin` — DramaVerse Admin, a React + Vite panel for managing dramas, episodes, and global monetization/ad settings, fully wired to the live API
- `artifacts/mockup-sandbox` — scaffolded but not yet used by this product
- `artifacts/landing` — DramaVerse Landing, the H5 marketing page (Vite + React, previewPath `/landing/`). Cinematic dark-theme hero/features/how-it-works/testimonials/FAQ/CTA sections with scroll animations (framer-motion), download CTAs, and a footer language switcher; images in `artifacts/landing/public/images/`.
- `artifacts/landing/src/context/LocaleContext.tsx` — detects locale via `GET /api/geo/locale` (IP-based, not device locale) on first load, persists manual override in localStorage (`landing_locale_override`), sets `document.documentElement.lang/dir` and injects locale-specific Google Fonts for non-Latin scripts.
- `artifacts/landing/src/i18n/` — `locales.ts` (same 10-locale set as mobile: en default + es, pt, ar[rtl], th, vi, id, ja, ko, zh-Hant, with font hrefs) and `translations.ts` (full copy catalog, all keys translated across all 10 locales).
- `artifacts/api-server/src/routes/geo.ts` — `GET /api/geo/locale` endpoint: extracts client IP, looks up country via ip-api.com (2s timeout, fails closed to `en`/non-rtl), maps country to one of the 10 supported locales.
- `artifacts/mobile/i18n/translations.ts` — i18n catalog: `SUPPORTED_LOCALES` (en default + es, pt, ar, th, vi, id, ja, ko, zh-Hant; `ar` flagged `rtl: true`) and full UI string translations for onboarding/login/home/search/profile.
- `artifacts/mobile/context/LocaleContext.tsx` — `LocaleProvider`/`useLocale()`/`getLocalizedTitle()`. Detects device locale via `expo-localization` on first launch, persists a manual override in AsyncStorage (`locale_override`), exposes `t()` for string lookup and `isRtl`.

## Architecture decisions

- 100% ad-based monetization (IAA) — no IAP, wallet, or coin system anywhere in the product, by explicit client requirement (avoids Apple's 30% cut and IAP review risk).
- "One drama, one policy" model: each drama independently configures `freeEpisodesCount`, `episodesPerAdUnlock`, and `interstitialAdFreq` — not a single global paywall rule.
- Fixed dark theme only (no light mode): background `#0A0D14`, surface `#1E2330`, divider `#2D3548`, primary accent `#F43F5E` (rose), free/reward badge `#EAB308` (yellow), text `#F8FAFC` / `#94A3B8` / `#64748B`.
- Real backend is live: Postgres schema for dramas/episodes/users/unlocked-episodes + global config, seeded with 5 dramas/84 episodes. Mobile app and admin panel both consume it through the same OpenAPI-generated hooks. Unlock state (`isUnlocked` per episode) is computed server-side in `GET /api/dramas/playback`, not client-side.
- Home screen supports curated, admin-managed sections (`home_sections` + `drama_home_sections` tables) in addition to the default drama list; managed from the admin panel's Home Sections page.
- Favorites and watch-progress are server-persisted (`favorites`, `watch_progress` tables), keyed by `userId` (device-scoped, not full account sync — no cross-device login required). Mobile `DramaContext` reads/writes these via `@workspace/api-client-react` hooks; no client-only fallback state.
- App-side i18n (mobile): device system locale drives UI language on first launch (via `expo-localization`), not IP — this is a deliberate requirement since the app itself isn't geo-gated. A manual language picker on the Profile screen can override the detected locale. Drama titles are stored per-locale in a `titles` jsonb map on `dramasTable` (replacing the old hardcoded `titleEs`/`titleZhTw` columns); `titleEn` remains the required fallback for any locale without a translated title. The admin panel's Drama edit form exposes one text field per supported locale in `ADDITIONAL_LOCALES`, all optional except English. `GET /api/dramas/playback` accepts an optional `locale` query param so the player's title is also server-localized, matching the client-side `getLocalizedTitle()` used everywhere else (home feed, search, favorites).
- H5 landing page (`artifacts/landing`) uses IP-based language/region detection (`GET /api/geo/locale`) instead of device locale, since it's a public web page hit before any app/device context exists — deliberately a different detection strategy from the mobile app. Same 10-locale set as mobile, with a manual override picker in the footer that takes precedence over IP detection.

## Product

- Vertical swipe video feed (TikTok-style) — tapping a poster jumps straight into fullscreen playback, no text detail page.
- Ad wall modal appears when swiping into a locked episode; simulates a rewarded-ad flow (loading → success/unlock or timeout-fail) and enforces a daily unlock cap.
- Episode drawer, like/favorite/share/report actions, and a profile screen with sign-in method, history, language picker, legal links, and one-tap delete account.
- Compliance-driven screens included for App Store review: simulated iOS ATT prompt on first launch, equal-weight Sign in with Apple / Google / Guest, always-reachable Report button, instant Delete Account.

## User preferences

- App store compliance requirements (from user's own spec docs) are non-negotiable and must not be simplified away: equal-weight three login options, always-visible Report button, 1-tap Delete Account, ATT prompt on first launch, graceful ad-timeout handling (no soft-locks).

## Gotchas

- `expo-video` is NOT pre-installed in the mobile scaffold — run `pnpm exec expo install expo-video` inside `artifacts/mobile` before using it, then restart the workflow.
- Artifact workflow names differ from the artifact slug — use `listWorkflows()` to get the exact registered name (e.g. the mobile app's workflow is `artifacts/mobile: expo`, not `mobile`).
- Expo bypasses the shared proxy, so `@workspace/api-client-react`'s `setBaseUrl` must be called at module top-level in `_layout.tsx` with `EXPO_PUBLIC_DOMAIN`, not a relative URL.
- In Express route files, register more specific static paths (e.g. `/dramas/playback`) before dynamic `:param` routes on the same prefix (e.g. `/dramas/:dramaId`) — otherwise the param route silently swallows the static one.
- In any artifact's `index.html`, static asset refs (favicon, etc.) must use Vite's `%BASE_URL%` placeholder (e.g. `href="%BASE_URL%favicon.svg"`), not a root-relative `/favicon.svg` — the latter 404s under the artifact's path-prefix proxy. Same rule applies to image `src`/CSS `url()` in app code: use `` `${import.meta.env.BASE_URL}images/...` ``, not `/images/...`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
