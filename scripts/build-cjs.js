#!/usr/bin/env node

/**
 * Script to generate CommonJS version of the plugin
 * This converts the ESM module to CommonJS format
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Read the ESM module
const esmContent = readFileSync(resolve(rootDir, 'lib', 'index.js'), 'utf8');

// Convert to CommonJS
// Replace ESM imports with require
let cjsContent = esmContent
  .replace(/import \* as ([a-zA-Z0-9_]+) from ['"]([^'"]+)['"]/g, 'const $1 = require("$2")')
  .replace(/import ([a-zA-Z0-9_]+) from ['"]([^'"]+)['"]/g, 'const $1 = require("$2")')
  .replace(/import \{ ([^}]+) \} from ['"]([^'"]+)['"]/g, (_, imports, source) => {
    const importsList = imports.split(',').map(i => i.trim());
    return `const { ${importsList.join(', ')} } = require("${source}")`;
  })
  // Convert export default to module.exports
  .replace(/export default/g, 'module.exports =')
  // Remove 'use strict' if present (already in wrapper)
  .replace(/'use strict';?\n?/g, '');

// Add CJS wrapper
cjsContent = `'use strict';

${cjsContent}
`;

// Write the CommonJS module
writeFileSync(resolve(rootDir, 'lib', 'index.cjs'), cjsContent);
console.log('Generated CommonJS module at lib/index.cjs');