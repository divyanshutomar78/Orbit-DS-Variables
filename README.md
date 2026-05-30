# Orbit Personal Tokens

Design tokens exported from Figma (`tokens.json`), built with [Style Dictionary](https://styledictionary.com/) and [@tokens-studio/sd-transforms](https://www.npmjs.com/package/@tokens-studio/sd-transforms) into **SCSS variables**, **CSS custom properties**, and **Tailwind maps** for colors and platform tokens.

Semantic theme colors keep their **links** to primitives (e.g. `{Green.400}` → `$green-400` / `var(--green-400)`).

## Quick start

```bash
npm install
npm run build:tokens
```

Source of truth: `tokens.json` (Figma / Tokens Studio export).

Generated output lives in `dist/`:

| Output | Path | Notes |
|--------|------|--------|
| Primitive SCSS | `dist/scss/primitives/_variables.scss` | Hex values |
| Theme SCSS | `dist/scss/themes/<theme>/_variables.scss` | References primitive `$variables` |
| Primitive CSS | `dist/css/primitives/variables.css` | `:root` custom properties |
| Theme CSS | `dist/css/themes/<theme>/variables.css` | `var(--primitive)` references |
| Theme CSS bundle | `dist/css/themes/<theme>/index.css` | Imports primitives + theme |
| Tailwind colors | `dist/tailwind/themes/<theme>/colors.js` | Nested object, `var(--*)` for aliases |
| Platform SCSS | `dist/scss/platforms/<platform>/_variables.scss` | Spacing, radius, font, components |
| Platform CSS | `dist/css/platforms/<platform>/variables.css` | `:root` custom properties |
| Platform Tailwind | `dist/tailwind/platforms/<platform>/tokens.js` | Full nested token tree |
| Platform Tailwind theme | `dist/tailwind/platforms/<platform>/theme.js` | Mapped to `theme.extend` keys |
| Barrel files | `dist/scss/_index.scss`, `dist/tailwind/index.js` | Re-exports all sets |

**Color themes:** `d-green`, `n-green`, `n-grey`, `n-blue`, `d-grey`

**Platforms:** `web`, `desktop`, `ipad`

## Usage

### SCSS

Import primitives before a theme so aliases resolve:

```scss
@use 'path/to/dist/scss/primitives/variables' as primitives;
@use 'path/to/dist/scss/themes/d-green/variables' as theme;
```

Or forward everything:

```scss
@use 'path/to/dist/scss/index';
```

### CSS / Tailwind v4

Load primitive CSS variables first, then the theme (or use the bundled `index.css`):

```css
@import "path/to/dist/css/themes/d-green/index.css";
```

Tailwind v4 `@theme` example:

```css
@import "tailwindcss";
@import "../dist/css/primitives/variables.css";
@import "../dist/css/themes/d-green/variables.css";
```

Tailwind v3 `theme.extend` from generated JS:

```js
import colors from './dist/tailwind/themes/d-green/colors.js';

export default {
  theme: {
    extend: { colors },
  },
};
```

Import `dist/css/primitives/variables.css` in your app so `var(--green-400)` tokens resolve.

### Platform tokens

SCSS:

```scss
@use 'path/to/dist/scss/platforms/web/variables' as web;
// web.$gap-m, web.$radius-s, web.$font-font-size-body, etc.
```

Tailwind v3 — use the pre-mapped `theme.js` for `theme.extend`:

```js
import webTheme from './dist/tailwind/platforms/web/theme.js';

export default {
  theme: {
    extend: webTheme,
  },
};
```

Or import the full nested tree from `tokens.js`:

```js
import webPlatform from './dist/tailwind/platforms/web/tokens.js';
```

Load platform CSS variables in your app:

```css
@import "path/to/dist/css/platforms/web/variables.css";
```

## How it works

1. **`scripts/split-tokens.mjs`** — splits `tokens.json` into `tokens/*.json` per Figma collection (gitignored; recreated on each build).
2. **`scripts/build-tokens.mjs`** — runs Style Dictionary per set:
   - **Color primitives** — single source file.
   - **Color themes** — primitives + theme sources (for alias resolution), output filtered to theme tokens only.
   - **Platforms** — Web, Desktop, iPad spacing, radius, typography, and component tokens.
3. **`outputReferences: true`** — SCSS/CSS keep aliases; Tailwind formats emit `var(--token-name)` for linked values.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build:tokens` | Split + build all platforms |
| `npm run split:tokens` | Split `tokens.json` only |

## Project layout

```
tokens.json              # Figma export (source of truth)
scripts/
  build-tokens.mjs       # Style Dictionary orchestration
  split-tokens.mjs       # Split multi-set JSON for SD
  formats/tailwind-colors.mjs
  formats/tailwind-nested.mjs
  formats/tailwind-theme.mjs
dist/                    # Generated (commit or CI-publish as you prefer)
```
