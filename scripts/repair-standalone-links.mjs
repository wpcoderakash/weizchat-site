/**
 * Put pnpm's symlinks back into a Next standalone release.
 *
 * Next traces the files a build needs and copies them into
 * `.next/standalone`. Under pnpm that copy is incomplete in one specific way:
 * the real package directories arrive, but the symlinks pnpm places *inside*
 * each package's own `node_modules` — the links that make a dependency
 * resolvable from the package that requires it — do not. The result boots
 * straight into `Cannot find module '@swc/helpers/...'`.
 *
 * Rather than chase whichever package the tracer happens to miss, this mirrors
 * every symlink the source tree has into the release, wherever the release
 * already contains both ends. It is deterministic, and `build-release.sh`
 * proves it worked by booting the release before calling it a release.
 */
import fs from 'node:fs';
import path from 'node:path';

const [, , sourceRoot, releaseRoot] = process.argv;
if (!sourceRoot || !releaseRoot) {
  console.error('usage: repair-standalone-links.mjs <source-node_modules> <release-node_modules>');
  process.exit(1);
}

let created = 0;
let skipped = 0;

/** Mirror the symlinks directly inside one directory. */
function mirrorDir(sourceDir, releaseDir) {
  let entries;
  try {
    entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const releasePath = path.join(releaseDir, entry.name);

    if (entry.isSymbolicLink()) {
      if (fs.existsSync(releasePath) || fs.lstatSync(releasePath, { throwIfNoEntry: false })) {
        skipped++;
        continue;
      }
      const target = fs.readlinkSync(sourcePath);
      // Only worth linking if the thing it points at exists in the release.
      const resolved = path.resolve(releaseDir, target);
      if (!fs.existsSync(resolved)) {
        skipped++;
        continue;
      }
      fs.mkdirSync(releaseDir, { recursive: true });
      fs.symlinkSync(target, releasePath);
      created++;
      continue;
    }

    // Scoped packages (@scope/name) hold their links one level down.
    if (entry.isDirectory() && entry.name.startsWith('@')) {
      mirrorDir(sourcePath, releasePath);
    }
  }
}

// Top level: node_modules/<pkg> and node_modules/@scope/<pkg>
mirrorDir(sourceRoot, releaseRoot);

// Each package's own dependency directory: .pnpm/<pkg>/node_modules/*
const sourceStore = path.join(sourceRoot, '.pnpm');
const releaseStore = path.join(releaseRoot, '.pnpm');
if (fs.existsSync(releaseStore)) {
  for (const pkg of fs.readdirSync(releaseStore)) {
    mirrorDir(path.join(sourceStore, pkg, 'node_modules'), path.join(releaseStore, pkg, 'node_modules'));
  }
}

console.log(`    restored ${created} symlink(s) (${skipped} already present or not applicable)`);
