import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { exportPublic, validatePublicPath } from '../scripts/export-public.mjs';

test('public export copies only explicitly reviewed files and preserves local state', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'chenne-export-test-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    await mkdir(path.join(root, '.git'));
    await mkdir(path.join(root, '.openai'));
    await writeFile(path.join(root, 'README.md'), 'Public project');
    await writeFile(path.join(root, '.env'), 'local settings');
    await writeFile(path.join(root, ':memory:.ses'), 'local session');
    await writeFile(path.join(root, '.openai/hosting.json'), '{}');
    const manifest = path.join(root, 'scripts/public-files.json');
    await writeFile(manifest, JSON.stringify(['README.md']));
    const { destination } = await exportPublic(root);
    assert.deepEqual(await readdir(destination), ['README.md']);
    assert.equal(await readFile(path.join(destination, 'README.md'), 'utf8'), 'Public project');
    assert.equal(await readFile(path.join(root, ':memory:.ses'), 'utf8'), 'local session');

    await symlink(path.join(root, '.env'), path.join(root, 'public.txt'));
    await writeFile(manifest, JSON.stringify(['public.txt']));
    await assert.rejects(exportPublic(root), /Symlink is not exportable/);

    await symlink(path.join(root, '.openai'), path.join(root, 'public-dir'));
    await writeFile(manifest, JSON.stringify(['public-dir/hosting.json']));
    await assert.rejects(exportPublic(root), /Symlink is not exportable/);

    await writeFile(manifest, JSON.stringify(['README.md', 'README.md']));
    await assert.rejects(exportPublic(root), /without duplicates/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('public export rejects traversal, hidden state, credentials and session files', () => {
  for (const file of [
    '../outside',
    '/absolute',
    'dist/../.env',
    'dist//app.js',
    'dist\\app.js',
    '.git/config',
    '.openai/hosting.json',
    '.env',
    'docs/.env.production',
    'private.pem',
    'server.key',
    'local.ses',
    'node_modules/tool.js',
  ])
    assert.throws(() => validatePublicPath(file));
  for (const file of ['README.md', 'dist/app.js', '.github/workflows/ci.yml', '.gitignore']) {
    assert.doesNotThrow(() => validatePublicPath(file));
  }
});
