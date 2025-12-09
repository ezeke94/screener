#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const patterns = [
  { name: 'Wildcard CORS', re: /Access-Control-Allow-Origin\"\s*:\s*\"\*\"/i },
  { name: 'Baked-in TALC key', re: /TALC_API_KEY_SECURE_882910/i },
  { name: 'x-talc-api-key in client', re: /x-talc-api-key/i }
];

function walk(dir) {
  let results = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (['node_modules', '.git'].includes(d.name)) return;
      results = results.concat(walk(p));
    } else {
      results.push(p);
    }
  });
  return results;
}

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const root = path.resolve(__dirname, '..');
  const files = walk(root).filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.jsx'));
  let found = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    patterns.forEach(p => {
      if (p.re.test(content)) {
        console.log(`${p.name} -> ${file}`);
        found++;
      }
    });
  }

  if (found === 0) {
    console.log('No obvious issues found by security-check.');
    process.exit(0);
  } else {
    console.warn(`${found} findings. Review the code and environment settings.`);
    process.exit(2);
  }
}

main();
