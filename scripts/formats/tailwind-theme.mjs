import { buildNestedTokenTree } from './tailwind-nested.mjs';

/** @param {string} segment */
function toKey(segment) {
  return String(segment).replace(/\s+/g, '-').toLowerCase();
}

/**
 * Map platform tokens into Tailwind `theme.extend` categories.
 * Numeric values are suffixed with `px` for spacing, radius, and font-size tokens.
 */
export function tailwindTheme({ dictionary, options, file }) {
  const useReferences = options?.outputReferences ?? true;
  const tokens = dictionary.allTokens;
  const nested = buildNestedTokenTree(dictionary, tokens, options);

  const px = (value) => {
    if (typeof value === 'number') return `${value}px`;
    if (typeof value === 'string' && /^\d+$/.test(value)) return `${value}px`;
    return value;
  };

  const mapLeaves = (obj, transform = (v) => v) => {
    const out = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(out, mapLeaves(val, transform));
      } else {
        out[toKey(key)] = transform(val);
      }
    }
    return out;
  };

  const theme = {};

  if (nested.gap) {
    theme.spacing = { ...theme.spacing, ...mapLeaves(nested.gap, px) };
  }

  if (nested.padding) {
    theme.spacing = { ...theme.spacing, ...mapLeaves(nested.padding, px) };
  }

  if (nested.radius) {
    theme.borderRadius = mapLeaves(nested.radius, px);
  }

  if (nested['icon-frame-size']) {
    theme.spacing = {
      ...theme.spacing,
      ...mapLeaves(nested['icon-frame-size'], px),
    };
  }

  if (nested.font?.['font-size']) {
    theme.fontSize = mapLeaves(nested.font['font-size'], px);
  }

  if (nested.font?.['font-weight']) {
    theme.fontWeight = mapLeaves(nested.font['font-weight']);
  }

  if (nested.font?.['line-height']) {
    theme.lineHeight = mapLeaves(nested.font['line-height'], px);
  }

  if (nested.font?.['letter-spacing']) {
    theme.letterSpacing = mapLeaves(nested.font['letter-spacing'], px);
  }

  if (nested.components) {
    theme.extend = mapLeaves(nested.components, px);
  }

  const header = file?.options?.header ?? true;
  const label = file?.options?.label ?? 'platform';
  const banner = header
    ? `// Auto-generated from tokens.json — do not edit directly.\n// Tailwind theme.extend for ${label}\n\n`
    : '';

  return `${banner}export default ${JSON.stringify(theme, null, 2)};\n`;
}
