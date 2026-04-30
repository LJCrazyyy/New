import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('.next');
const targetDir = path.resolve('.netlify/next');

async function main() {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });
}

main().catch((error) => {
  console.error('Failed to prepare Netlify publish directory:', error);
  process.exit(1);
});
