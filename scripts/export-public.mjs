import { copyFile, lstat, mkdir, mkdtemp, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const allowedDotfiles = new Set([
  '.editorconfig',
  '.gitignore',
  '.gitleaks.toml',
  '.prettierignore',
  '.prettierrc.json',
]);

export function validatePublicPath(file) {
  if (typeof file !== 'string' || !file || path.isAbsolute(file) || file.includes('\\')) {
    throw new Error('Public export entries must be relative POSIX file paths.');
  }
  const parts = file.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe public export path: ${file}`);
  }
  for (const [index, part] of parts.entries()) {
    const allowed = index === 0 && (allowedDotfiles.has(part) || part === '.github');
    if (
      (part.startsWith('.') && !allowed) ||
      /\.(?:ses|pem|key|p12|pfx|log)$/i.test(part) ||
      part === 'node_modules'
    ) {
      throw new Error(`Local or sensitive file is not exportable: ${file}`);
    }
  }
}

export async function readPublicFiles(sourceRoot = projectRoot) {
  const root = await realpath(sourceRoot);
  const files = JSON.parse(await readFile(path.join(root, 'scripts/public-files.json'), 'utf8'));
  if (!Array.isArray(files) || !files.length || new Set(files).size !== files.length) {
    throw new Error('The public file manifest must be a nonempty list without duplicates.');
  }
  // Validate every file before creating output. Never follow a link into local state.
  for (const file of files) {
    validatePublicPath(file);
    let entry = root;
    for (const part of file.split('/')) {
      entry = path.join(entry, part);
      if ((await lstat(entry)).isSymbolicLink())
        throw new Error(`Symlink is not exportable: ${file}`);
    }
    if (!(await lstat(entry)).isFile()) throw new Error(`Not a regular file: ${file}`);
  }
  return { root, files };
}

export async function exportPublic(sourceRoot = projectRoot) {
  const { root, files } = await readPublicFiles(sourceRoot);
  const releaseRoot = path.join(root, '.release');
  await mkdir(releaseRoot, { recursive: true });
  if ((await lstat(releaseRoot)).isSymbolicLink())
    throw new Error('The export directory must not be a symlink.');
  const destination = await mkdtemp(path.join(releaseRoot, 'chenne-mane-'));
  for (const file of files) {
    const target = path.join(destination, file);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(root, file), target);
  }
  return { destination, count: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { destination, count } = await exportPublic();
  console.log(`Exported ${count} reviewed files to ${destination}`);
  console.log('No Git history or local hosting/session state was copied. Nothing was published.');
}
