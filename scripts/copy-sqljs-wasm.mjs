// Copies sql.js's wasm binary into public/ so it's served as a static
// asset at runtime (sql.js needs to fetch it at startup; it can't be
// bundled into the JS the way regular imports are). Run automatically via
// the "postinstall" npm script, so it always matches whatever sql.js
// version is installed -- the wasm file itself is NOT committed to git
// (see .gitignore), since it's a build-time copy of something already in
// node_modules.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
const destDir = join(root, 'public')
const dest = join(destDir, 'sql-wasm.wasm')

if (!existsSync(src)) {
  console.warn('[copy-sqljs-wasm] sql.js wasm file not found at', src, '-- skipping.')
  process.exit(0)
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true })
}

copyFileSync(src, dest)
console.log('[copy-sqljs-wasm] Copied sql-wasm.wasm to public/')
