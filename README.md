
```markdown
# Orbit DS Variables

Design tokens exported from Figma (`tokens.json`), built with Style Dictionary and @tokens-studio/sd-transforms into **SCSS variables**, **CSS custom properties**, and **Tailwind maps** for colors and platform tokens.

Semantic theme colors keep their links to primitives (e.g., `{Green.400}` → `$green-400` / `var(--green-400)`).

---

## 🚀 Quick Start (Installation)

Install the design tokens into your project using npm:

```bash
npm install orbit-ds-variables

```

*(Note: Whenever the design team publishes a new update, run `npm install orbit-ds-variables@latest` to get the freshest colors and spacing).*

---

## 🎨 Usage

### 1. SCSS (Recommended)

Thanks to the bundled theme files, you do not need to manually import primitive colors. Just import the specific theme you want, and all base colors will come with it automatically.

```scss
/* Import your chosen theme bundle */
@use 'orbit-ds-variables/dist/scss/themes/d-grey' as *;

.my-card {
  /* You can now use variables directly with the $ symbol */
  background-color: $background-background;
  color: $green-400;
}

```

> **⚠️ Important Note on Multiple Themes:** Do not import the master `dist/scss/index` file. Because different themes use the exact same variable names (like `$text-primary`), importing them all at once will cause them to overwrite each other. Always import one theme at a time!

#### 💡 Tip: How to get SCSS Autocomplete in VS Code

By default, VS Code does not suggest SCSS variables from `node_modules`. To fix this and get a dropdown list of all your `$tokens` while typing:

1. Open the VS Code **Extensions** tab.
2. Search for and install **SCSS IntelliSense** (by mrmlnc).
3. Give it a second to load. The next time you type `$` in your file, VS Code will scan the `@use` path and show you all available design system variables.

---

### 2. Standard CSS / HTML

If you are using plain HTML and CSS, use the pre-bundled CSS file that includes both your primitive colors and your theme colors.

**Option A: Link directly in HTML**

```html
<link rel="stylesheet" href="./node_modules/orbit-ds-variables/dist/css/themes/d-grey/index.css">

```

**Option B: Import into your main CSS file**

```css
@import 'orbit-ds-variables/dist/css/themes/d-grey/index.css';

.my-card {
  background-color: var(--background-background);
  color: var(--green-400);
}

```

---

### 3. Tailwind CSS

**Tailwind v4 (@theme example):**

```css
@import "tailwindcss";
@import "../node_modules/orbit-ds-variables/dist/css/themes/d-grey/index.css";

```

**Tailwind v3 (theme.extend):**

```javascript
import colors from 'orbit-ds-variables/dist/tailwind/themes/d-grey/colors.js';

export default {
  theme: {
    extend: { colors },
  },
};

```

*(Make sure to also import the CSS variables file in your app so the `var(--...)` tokens resolve properly).*

---

## 📱 Platform Tokens (Web, Desktop, iPad)

Platform tokens hold your spacing, radius, typography, and component sizes.

**SCSS:**

```scss
@use 'orbit-ds-variables/dist/scss/platforms/web/variables' as web;

.container {
  padding: web.$gap-m;
  border-radius: web.$radius-s;
}

```

**Tailwind v3:**

```javascript
import webTheme from 'orbit-ds-variables/dist/tailwind/platforms/web/theme.js';

export default {
  theme: {
    extend: webTheme,
  },
};

```

---

## ⚙️ How It Works (For Contributors)

* `scripts/split-tokens.mjs` — Splits `tokens.json` into `tokens/*.json` per Figma collection.
* `scripts/build-tokens.mjs` — Runs Style Dictionary to generate all final SCSS, CSS, and Tailwind formats.

### To rebuild locally:

```bash
git clone [https://github.com/divyanshutomar78/Orbit-DS-Variables.git](https://github.com/divyanshutomar78/Orbit-DS-Variables.git)
cd Orbit-DS-Variables
npm install
npm run build:tokens

```

### GitHub Automation

When `tokens.json` is updated from Figma/Tokens Studio and pushed to the `main` branch, a GitHub Action automatically runs the build script and updates the `dist/` folder. The package can then be updated and published to npm.

```

```