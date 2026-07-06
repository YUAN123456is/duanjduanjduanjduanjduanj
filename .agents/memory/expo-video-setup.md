---
name: Expo video dependency
description: expo-video must be installed manually in Expo scaffolds; it is not pre-installed like expo-image or expo-haptics.
---

The Expo mobile scaffold's `package.json` does not include `expo-video` by default (unlike `expo-image`, `expo-haptics`, `expo-blur`, etc.). Any app that needs native video playback (e.g. a video feed, player, or short-drama app) will fail to bundle with `Unable to resolve "expo-video"` until it's added.

**How to apply:** Before or right after a design subagent uses `useVideoPlayer`/`VideoView` from `expo-video`, run `pnpm exec expo install expo-video` inside the artifact directory (e.g. `artifacts/<slug>`), then restart the workflow. Check bundler logs after restart to confirm no other "Unable to resolve" errors remain.
