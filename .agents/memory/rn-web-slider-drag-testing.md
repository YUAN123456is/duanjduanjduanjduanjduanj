---
name: RN-web slider drag testing limitation
description: Why automated browser drag on @react-native-community/slider (or any RN responder-based component) can show false failures on web, and how to verify seek/drag features reliably instead.
---

`@react-native-community/slider`'s web build uses React Native's standard gesture responder system (`onStartShouldSetResponder` / `onResponderMove` / `onResponderRelease`), not a native `<input type=range>` or HTML5 drag-and-drop element.

**Why it matters:** Playwright's high-level "drag" action (and even manual mousedown+mousemove+mouseup sequences) frequently fails to trigger this responder system reliably in automated tests — the thumb appears to snap back to its start position even though the same interaction works fine as a plain click/tap on the track. Two independent implementations (a hand-rolled PanResponder bar and the official slider library) both showed this pattern under automated drag testing, while single click-to-seek on the track worked and held correctly every time.

**How to apply:** When verifying seek/progress-bar/slider features built on RN's responder system in this project, test via a single click/tap at a target position along the track (which triggers the responder grant+release in one gesture) rather than relying on a simulated multi-step drag. Treat automated "drag doesn't move the thumb" results skeptically — confirm with click-based interaction before concluding there's a real bug, especially since real device touch/mouse drag (not synthetic browser automation) is handled by the same production-tested responder code path used by native `Slider` everywhere.
