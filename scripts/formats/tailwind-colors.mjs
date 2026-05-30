import { isColor } from '../filters/color.mjs';
import { buildNestedTokenTree } from './tailwind-nested.mjs';

/**
 * Nested Tailwind `theme.extend.colors` with references preserved.
 */
export function tailwindColors({ dictionary, options, file }) {
  const tokens = dictionary.allTokens.filter((token) => isColor(token, options));
  const tree = buildNestedTokenTree(dictionary, tokens, options);

  const header = file?.options?.header ?? true;
  const banner = header
    ? `// Auto-generated from tokens.json — do not edit directly.\n// Theme: ${file?.options?.themeLabel ?? 'colors'}\n\n`
    : '';

  return `${banner}export default ${JSON.stringify(tree, null, 2)};\n`;
}
