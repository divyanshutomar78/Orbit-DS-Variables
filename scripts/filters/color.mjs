/** @param {import('style-dictionary').DesignToken} token */
export function isColor(token) {
  return (token?.$type ?? token?.type) === 'color';
}
