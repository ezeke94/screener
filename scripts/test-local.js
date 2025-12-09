#!/usr/bin/env node
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const LOCAL_URL = process.argv[3] || 'http://localhost:8888/.netlify/functions/proxy-analyze';
const imagePath = process.argv[2] || './test-photo.jpg';

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

(async function main(){
  console.log('Local Screener Test');
  console.log('Endpoint:', LOCAL_URL);

  if (!fs.existsSync(imagePath)){
    console.error('Image not found:', imagePath);
    process.exit(1);
  }

  const buf = fs.readFileSync(imagePath);
  const imageBase64 = buf.toString('base64');
  const mimeType = getMimeType(imagePath);

  console.log('Image loaded:', imagePath, mimeType, `${buf.length} bytes`);

  const payload = { imageBase64, mimeType };

  try {
    const res = await fetch(LOCAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 60000
    });

    console.log('Status:', res.status);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', text);
    }
  } catch (err) {
    console.error('Request failed:', err.message || err);
    process.exit(1);
  }
})();
