#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USAGE = `
Usage:
  node ./scripts/test-screener.js <image-path> [--url <function-url>] [--key <TALC_API_KEY>]

Examples:
  node ./scripts/test-screener.js ./photo.jpg --url http://localhost:8888/.netlify/functions/analyze
  node ./scripts/test-screener.js ./photo.jpg --url https://screener-talc.netlify.app/.netlify/functions/analyze --key talc_sk_XXX
`;

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(USAGE);
    process.exit(1);
  }

  const file = args[0];
  let url = 'http://localhost:8888/.netlify/functions/analyze';
  let key = process.env.TALC_API_KEY || '';

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      url = args[i + 1];
      i++;
    } else if (args[i] === '--key' && args[i + 1]) {
      key = args[i + 1];
      i++;
    }
  }

  if (!fs.existsSync(file)) {
    console.error(`Image not found: ${file}`);
    process.exit(2);
  }

  const b = fs.readFileSync(file);
  const base64 = b.toString('base64');

  // Example criteria used by the UI. Update as needed.
  const criteria = [
    { id: '1', label: 'No strong blur', type: 'forbidden', strictness: 'High' },
    { id: '2', label: 'Subject centered', type: 'desired' }
  ];

  const payload = {
    imageBase64: base64,
    mimeType: getMimeType(file) || 'image/jpeg',
    criteria
  };

  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['x-talc-api-key'] = key;

  console.log('Posting to:', url);
  if (!key) console.warn('Warning: No TALC_API_KEY provided. Request will be unauthorized for production endpoints.');

  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers, timeout: 60_000 });
    const text = await res.text();
    console.log('Response status:', res.status);
    console.log('Response body:');
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      console.log(text);
    }
  } catch (err) {
    console.error('Request failed:', String(err));
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return '';
}

main();
