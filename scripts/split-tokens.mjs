import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'tokens.json');
const OUT_DIR = path.join(ROOT, 'tokens');

/** @param {string} setName */
export function slugifySetName(setName) {
  return setName
    .toLowerCase()
    .replace(/[:/]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** @returns {Promise<{ sets: Record<string, string>, colorSets: string[], platformSets: string[] }>} */
export async function splitTokens() {
  const raw = JSON.parse(await readFile(SOURCE, 'utf8'));
  const { $themes, $metadata, ...sets } = raw;

  await mkdir(OUT_DIR, { recursive: true });

  const manifest = {
    tokenSetOrder: $metadata?.tokenSetOrder ?? Object.keys(sets),
    sets: {},
  };

  for (const [setName, setTokens] of Object.entries(sets)) {
    const slug = slugifySetName(setName);
    const fileName = `${slug}.json`;
    const filePath = path.join(OUT_DIR, fileName);
    await writeFile(filePath, `${JSON.stringify(setTokens, null, 2)}\n`, 'utf8');
    manifest.sets[setName] = fileName;
  }

  if ($themes?.length) {
    await writeFile(path.join(OUT_DIR, '$themes.json'), `${JSON.stringify($themes, null, 2)}\n`);
  }

  await writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  const colorSets = Object.keys(sets).filter((name) => name.startsWith('Color:'));
  const platformSets = Object.keys(sets).filter((name) => name.startsWith('Platform/'));

  return { sets: manifest.sets, colorSets, platformSets };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMain) {
  const result = await splitTokens();
  console.log(`Split ${Object.keys(result.sets).length} token sets into tokens/`);
  console.log(`Color sets: ${result.colorSets.length}`);
  console.log(`Platform sets: ${result.platformSets.length}`);
}
