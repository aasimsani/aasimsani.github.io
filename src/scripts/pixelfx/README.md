# Vendored PixelFX

`core/` and the effects under `fx/` are copied from [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) 0.3.0 (commit a841596), MIT licensed (see `LICENSE`). Only the effects the site plays are here, each with its category's `_lib.js`.

Local changes, each marked with an "aasimsani.net fork" comment:

- `fx/weather/fireflies.js`, `falling-leaves.js`, `god-rays.js` and `shooting-stars.js` take `backdrop: false`, which skips the haze, meadow, litter and starfield they paint, so they float over the site's own sky.

To update, copy the same files from a newer pixelfx checkout and re-apply the forks.
