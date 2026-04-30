import { cp, mkdir, rm, writeFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('.next');
const targetDir = path.resolve('.netlify/next');

async function main() {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  // Copy .next contents but skip node_modules to avoid symlink permission issues on Windows
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const src = path.join(sourceDir, entry.name);
    const dest = path.join(targetDir, entry.name);
    await cp(src, dest, { recursive: true });
  }

  // Compatibility shim: some Netlify plugin versions expect an internal
  // Next.js module at `next/dist/server/lib/start-server.js`. Newer
  // Next releases may move/rename this file. Create a small shim in
  // node_modules when possible so runtime `require()` calls succeed.
  try {
    const shimDir = path.resolve('node_modules', 'next', 'dist', 'server', 'lib');
    const shimPath = path.join(shimDir, 'start-server.js');
    // Only write the shim if the directory exists and the shim doesn't already exist.
    await stat(shimDir);
    try {
      await stat(shimPath);
      // shim already exists — do nothing
    } catch {
      const content = "module.exports = require('../next-server');\n";
      await writeFile(shimPath, content, { encoding: 'utf8' });
    }
  } catch (err) {
    // If node_modules/next isn't present (e.g., in some CI steps), ignore silently.
  }
}

main().catch((error) => {
  console.error('Failed to prepare Netlify publish directory:', error);
  process.exit(1);
});
