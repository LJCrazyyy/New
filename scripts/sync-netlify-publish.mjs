import { cp, mkdir, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname } from "node:path"

const sourceDir = ".next"
const targetDir = ".netlify/next"

if (!existsSync(sourceDir)) {
  throw new Error(`Expected ${sourceDir} to exist after the Next build.`)
}

await rm(targetDir, { recursive: true, force: true })
await mkdir(dirname(targetDir), { recursive: true })
await cp(sourceDir, targetDir, { recursive: true, force: true })