import it from '../src/i18n/locales/it.js'
import en from '../src/i18n/locales/en.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getAllKeys(obj, prefix = '') {
  let keys = []
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullPath))
    } else {
      keys.push(fullPath)
    }
  }
  return keys
}

const itKeys = new Set(getAllKeys(it))
const enKeys = new Set(getAllKeys(en))

console.log(`\n=== Parity Check ===`)
console.log(`IT total keys: ${itKeys.size}`)
console.log(`EN total keys: ${enKeys.size}`)

const missingInEn = [...itKeys].filter(k => !enKeys.has(k))
const missingInIt = [...enKeys].filter(k => !itKeys.has(k))

let hasError = false

if (missingInEn.length > 0) {
  console.error(`\n❌ Keys in IT missing in EN (${missingInEn.length}):`)
  missingInEn.forEach(k => console.error(`  - ${k}`))
  hasError = true
}

if (missingInIt.length > 0) {
  console.error(`\n❌ Keys in EN missing in IT (${missingInIt.length}):`)
  missingInIt.forEach(k => console.error(`  - ${k}`))
  hasError = true
}

if (!hasError) {
  console.log(`✅ 100% Key Parity between IT and EN! (${itKeys.size} keys each)`)
}

// Check for missing keys in codebase
console.log(`\n=== Codebase Usage Verification ===`)
const srcDir = path.resolve(__dirname, '../src')

function scanFiles(dir) {
  let files = []
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item)
    if (fs.statSync(full).isDirectory()) {
      if (item !== 'node_modules') files = files.concat(scanFiles(full))
    } else if (full.endsWith('.vue') || full.endsWith('.js')) {
      if (!full.includes('locales') && !full.includes('check-i18n.js')) {
        files.push(full)
      }
    }
  }
  return files
}

const files = scanFiles(srcDir)
const regexT = /(?:\$t|t)\(\s*['"`]([a-zA-Z0-9_.]+)['"`]/g

const missingUsedKeys = new Set()
const usedKeys = new Set()

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8')
  let match
  while ((match = regexT.exec(content)) !== null) {
    const key = match[1]
    usedKeys.add(key)
    if (!itKeys.has(key)) {
      // Ignore dynamic prefixes like 'dietometer.categories.' or 'patterns.' if computed
      missingUsedKeys.add({ file: path.relative(srcDir, file), key })
    }
  }
}

console.log(`Total unique static i18n keys used in codebase: ${usedKeys.size}`)

if (missingUsedKeys.size > 0) {
  console.warn(`\n⚠️ Potential keys used in code not found directly in catalog:`)
  missingUsedKeys.forEach(({ file, key }) => {
    console.warn(`  [${file}] -> ${key}`)
  })
} else {
  console.log(`✅ All statically referenced keys exist in catalog!`)
}

if (hasError) {
  process.exit(1)
} else {
  console.log(`\n🎉 Verification Passed Successfully!`)
}
