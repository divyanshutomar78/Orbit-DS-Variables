import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';
import { formats } from 'style-dictionary/enums';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { splitTokens, slugifySetName } from './split-tokens.mjs';
import { tailwindColors } from './formats/tailwind-colors.mjs';
import { tailwindNested } from './formats/tailwind-nested.mjs';
import { tailwindTheme } from './formats/tailwind-theme.mjs';
import { isColor } from './filters/color.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const PRIMITIVES_SET = 'Color: Primitives/Value';
const THEME_SET_PREFIX = 'Color: Themes/';
const PLATFORM_SET_PREFIX = 'Platform/';

register(StyleDictionary, {
  excludeParentKeys: false,
  platform: 'css',
});

StyleDictionary.registerFormat({
  name: 'tailwind/nested-colors',
  format: tailwindColors,
});

StyleDictionary.registerFormat({
  name: 'tailwind/nested',
  format: tailwindNested,
});

StyleDictionary.registerFormat({
  name: 'tailwind/theme',
  format: tailwindTheme,
});

const { scssVariables, cssVariables } = formats;

/** @param {string} setName @param {Record<string, string>} sets */
function colorSourcesForSet(setName, sets) {
  const primitives = `tokens/${sets[PRIMITIVES_SET]}`;
  const current = `tokens/${sets[setName]}`;

  if (setName === PRIMITIVES_SET) {
    return [current];
  }

  return [primitives, current];
}

/** @param {string} setName */
function themeSlugFromSet(setName) {
  return slugifySetName(setName.replace(THEME_SET_PREFIX, ''));
}

/** @param {string} setName */
function platformSlugFromSet(setName) {
  return slugifySetName(setName.replace(PLATFORM_SET_PREFIX, ''));
}

/** @param {string} slug */
function toExportName(slug) {
  return slug.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * @param {object} params
 * @param {string} params.setName
 * @param {'primitives' | 'theme'} params.kind
 */
function createColorConfig({ setName, kind, sets }) {
  const slug = kind === 'primitives' ? 'primitives' : themeSlugFromSet(setName);
  const buildSubpath = kind === 'primitives' ? 'primitives' : `themes/${slug}`;
  const setFileName = sets[setName];
  const tokenFilter =
    kind === 'primitives'
      ? isColor
      : (token) => token.filePath?.endsWith(setFileName) && isColor(token);

  return {
    log: { verbosity: 'default' },
    source: colorSourcesForSet(setName, sets),
    preprocessors: ['tokens-studio'],
    platforms: {
      scss: {
        transformGroup: 'tokens-studio',
        transforms: ['name/kebab'],
        buildPath: `dist/scss/${buildSubpath}/`,
        files: [
          {
            destination: '_variables.scss',
            format: scssVariables,
            filter: tokenFilter,
            options: { outputReferences: true },
          },
        ],
      },
      css: {
        transformGroup: 'tokens-studio',
        transforms: ['name/kebab'],
        buildPath: `dist/css/${buildSubpath}/`,
        files: [
          {
            destination: 'variables.css',
            format: cssVariables,
            filter: tokenFilter,
            options: { outputReferences: true },
          },
        ],
      },
      tailwind: {
        transformGroup: 'tokens-studio',
        transforms: ['name/kebab'],
        buildPath: `dist/tailwind/${buildSubpath}/`,
        files: [
          {
            destination: 'colors.js',
            format: 'tailwind/nested-colors',
            filter: tokenFilter,
            options: {
              outputReferences: true,
              themeLabel: slug,
            },
          },
        ],
      },
    },
  };
}

/** @param {object} params */
function createPlatformConfig({ setName, sets }) {
  const slug = platformSlugFromSet(setName);
  const buildSubpath = `platforms/${slug}`;
  const setFileName = sets[setName];
  const tokenFilter = (token) => token.filePath?.endsWith(setFileName);

  return {
    log: { verbosity: 'default' },
    source: [`tokens/${setFileName}`],
    preprocessors: ['tokens-studio'],
    platforms: {
      scss: {
        transformGroup: 'tokens-studio',
        transforms: ['name/kebab'],
        buildPath: `dist/scss/${buildSubpath}/`,
        files: [
          {
            destination: '_variables.scss',
            format: scssVariables,
            filter: tokenFilter,
            options: { outputReferences: true },
          },
        ],
      },
      css: {
        transformGroup: 'tokens-studio',
        transforms: ['name/kebab'],
        buildPath: `dist/css/${buildSubpath}/`,
        files: [
          {
            destination: 'variables.css',
            format: cssVariables,
            filter: tokenFilter,
            options: { outputReferences: true },
          },
        ],
      },
      tailwind: {
        transformGroup: 'tokens-studio',
        transforms: ['name/kebab'],
        buildPath: `dist/tailwind/${buildSubpath}/`,
        files: [
          {
            destination: 'tokens.js',
            format: 'tailwind/nested',
            filter: tokenFilter,
            options: {
              outputReferences: true,
              label: `Platform: ${slug}`,
            },
          },
          {
            destination: 'theme.js',
            format: 'tailwind/theme',
            filter: tokenFilter,
            options: {
              outputReferences: true,
              label: slug,
            },
          },
        ],
      },
    },
  };
}

async function writeBarrelFiles(colorSets, platformSets) {
  const scssForwards = [];
  const tailwindExports = [];

  for (const setName of colorSets) {
    const kind = setName === PRIMITIVES_SET ? 'primitives' : 'theme';
    const slug = kind === 'primitives' ? 'primitives' : themeSlugFromSet(setName);
    const buildSubpath = kind === 'primitives' ? 'primitives' : `themes/${slug}`;

    scssForwards.push(`@forward '${buildSubpath}/variables';`);

    const exportName = kind === 'primitives' ? 'primitives' : toExportName(slug);
    tailwindExports.push(
      `export { default as ${exportName} } from './${buildSubpath}/colors.js';`,
    );
  }

  for (const setName of platformSets) {
    const slug = platformSlugFromSet(setName);
    const buildSubpath = `platforms/${slug}`;

    scssForwards.push(`@forward '${buildSubpath}/variables';`);

    const exportName = `${toExportName(slug)}Platform`;
    tailwindExports.push(
      `export { default as ${exportName} } from './${buildSubpath}/tokens.js';`,
    );
    tailwindExports.push(
      `export { default as ${exportName}Theme } from './${buildSubpath}/theme.js';`,
    );
  }

  await mkdir(path.join(ROOT, 'dist/scss'), { recursive: true });
  await mkdir(path.join(ROOT, 'dist/tailwind'), { recursive: true });

  await writeFile(
    path.join(ROOT, 'dist/scss/_index.scss'),
    `// Auto-generated from tokens.json — do not edit directly.\n${scssForwards.join('\n')}\n`,
  );

  await writeFile(
    path.join(ROOT, 'dist/tailwind/index.js'),
    `// Auto-generated from tokens.json — do not edit directly.\n${tailwindExports.join('\n')}\n`,
  );
}

async function writeThemeCssBundles(colorSets) {
  for (const setName of colorSets) {
    if (!setName.startsWith(THEME_SET_PREFIX)) continue;
    const slug = themeSlugFromSet(setName);
    const css = `/* Auto-generated from tokens.json — do not edit directly. */\n@import '../primitives/variables.css';\n@import './variables.css';\n`;
    await writeFile(path.join(ROOT, 'dist/css/themes', slug, 'index.css'), css);
  }
}

async function build() {
  const { sets, colorSets, platformSets } = await splitTokens();

  const colorConfigs = colorSets.map((setName) => {
    const kind = setName === PRIMITIVES_SET ? 'primitives' : 'theme';
    return createColorConfig({ setName, kind, sets });
  });

  const platformConfigs = platformSets.map((setName) =>
    createPlatformConfig({ setName, sets }),
  );

  const configs = [...colorConfigs, ...platformConfigs];

  await Promise.all(
    configs.map(async (config) => {
      const sd = new StyleDictionary(config);
      await sd.cleanAllPlatforms();
      await sd.buildAllPlatforms();
    }),
  );

  await writeBarrelFiles(colorSets, platformSets);
  await writeThemeCssBundles(colorSets);

  console.log(
    `Built ${colorSets.length} color sets + ${platformSets.length} platform sets into dist/`,
  );
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
