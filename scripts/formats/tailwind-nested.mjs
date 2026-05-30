import { usesReferences, getReferences } from 'style-dictionary/utils';

/** @param {string} segment */
function toKey(segment) {
  return String(segment).replace(/\s+/g, '-').toLowerCase();
}

/**
 * Resolve a token value, preserving references as CSS custom properties.
 *
 * @param {import('style-dictionary').DesignToken} token
 * @param {import('style-dictionary').Dictionary} dictionary
 * @param {boolean} useReferences
 */
function resolveValue(token, dictionary, useReferences) {
  const originalValue = token.original?.$value ?? token.original?.value;
  let value = token.$value ?? token.value;

  if (useReferences && usesReferences(originalValue)) {
    const refs = getReferences(originalValue, dictionary.tokens, {
      usesDtcg: true,
      unfilteredTokens: dictionary.unfilteredTokens,
      warnImmediately: false,
    });
    const ref = refs[refs.length - 1];
    if (ref?.name) {
      return `var(--${ref.name})`;
    }
  }

  return value;
}

/**
 * Build a nested object from flat tokens (shared by color + platform outputs).
 *
 * @param {import('style-dictionary').Dictionary} dictionary
 * @param {import('style-dictionary').DesignToken[]} tokens
 * @param {object} [options]
 */
export function buildNestedTokenTree(dictionary, tokens, options = {}) {
  const useReferences = options.outputReferences ?? true;
  const root = {};

  for (const token of tokens) {
    const pathParts = token.path;
    let cursor = root;

    for (let i = 0; i < pathParts.length - 1; i += 1) {
      const key = toKey(pathParts[i]);
      cursor[key] = cursor[key] ?? {};
      cursor = cursor[key];
    }

    cursor[toKey(pathParts[pathParts.length - 1])] = resolveValue(
      token,
      dictionary,
      useReferences,
    );
  }

  return root;
}

/**
 * Nested Tailwind token map with references preserved.
 *
 * @see https://tailwindcss.com/docs/customizing-colors#using-css-variables
 */
export function tailwindNested({ dictionary, options, file }) {
  const tokens = dictionary.allTokens;
  const tree = buildNestedTokenTree(dictionary, tokens, options);

  const header = file?.options?.header ?? true;
  const label = file?.options?.label ?? 'tokens';
  const banner = header
    ? `// Auto-generated from tokens.json — do not edit directly.\n// ${label}\n\n`
    : '';

  return `${banner}export default ${JSON.stringify(tree, null, 2)};\n`;
}
