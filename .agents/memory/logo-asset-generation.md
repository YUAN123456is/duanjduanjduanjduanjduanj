---
name: Crisp logo/wordmark generation technique
description: How to build a sharp, on-brand wordmark logo (icon + text) that doesn't blur when scaled to small UI sizes
---

AI image generation does not reliably render text, so brand wordmarks ("Nebula TV" etc.) should not be produced by prompting an image model for text. Likewise, don't derive a wordmark by background-removing a photographic/AI-generated source image that has soft neon-glow letter edges baked into the pixels — that softness reads as "blurry" once the logo is scaled down to a small header (~32px), since there's no crisp edge to downsample from.

**Better approach:** compose the wordmark programmatically with ImageMagick:
1. Render text as a sharp vector-quality mask (`-font <Bold> -pointsize <large> -fill white -annotate`) on a large transparent canvas.
2. Fill the mask with a gradient sampled from the brand icon's own colors (`gradient:` + `-compose CopyOpacity`) so the text matches brand palette.
3. Optionally add a soft outer glow as a *separate* blurred/dilated copy placed behind the crisp text (not blurring the text itself) for stylistic cohesion with a glowing icon mark.
4. Composite with the icon, trim, and export at high resolution (e.g. 1800px wide) so downscaling to any UI size stays sharp.
5. Verify true alpha transparency with `magick <file> -format "%[pixel:p{x,y}]" info:` at background sample points — some preview/render tools display transparent PNG regions as solid black instead of checkerboard, which is a viewer quirk, not a real transparency bug.

**Why:** produces a crisp, on-brand, small-size-safe logo without relying on unreliable AI text rendering or degraded photographic source assets.

**Separately:** a native app's boot/download splash icon (e.g. Expo Go's "Downloading X%" screen) is cached by the native client itself, not just served from the dev server — updating the icon file and restarting the workflow may not be visually verifiable via web/app-preview screenshots (those show the JS app, not the native pre-load splash). Clearing `.expo` cache dirs and restarting is the right fix on the server side, but confirming the fix may require the user to force-refresh the actual Expo Go client.
