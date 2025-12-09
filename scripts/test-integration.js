#!/usr/bin/env node
/**
 * Integration test for the screener API
 * Demonstrates how other apps should call the proxy-analyze endpoint
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://screener-talc.netlify.app/.netlify/functions/proxy-analyze';

/**
 * Test the screener API with a sample image
 */
async function testScreenerAPI(imagePath) {
  console.log('🧪 Screener API Integration Test\n');
  console.log(`Testing endpoint: ${API_URL}\n`);

  // 1. Read and encode image
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Image not found: ${imagePath}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  const mimeType = getMimeType(imagePath);

  console.log(`✅ Image loaded: ${imagePath} (${mimeType})`);
  console.log(`✅ Image size: ${imageBuffer.length} bytes\n`);

  // 2. Prepare request payload
  const criteria = [
    { id: '1', label: 'No strong blur', type: 'forbidden', strictness: 'High' },
    { id: '2', label: 'Subject centered', type: 'desired' },
    { id: '3', label: 'Good lighting', type: 'desired' }
  ];

  const payload = {
    imageBase64,
    mimeType,
    criteria
  };

  console.log('📋 Request criteria:');
  criteria.forEach(c => {
    console.log(`  - ${c.label} (${c.type}, strictness: ${c.strictness || 'N/A'})`);
  });
  console.log();

  // 3. Call the API
  console.log('🚀 Sending request...\n');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 60000
    });

    const statusCode = response.status;
    const responseText = await response.text();

    console.log(`📊 Response Status: ${statusCode}\n`);

    // 4. Parse and display result
    if (statusCode === 200) {
      const result = JSON.parse(responseText);
      console.log('✅ Analysis Complete!\n');
      console.log(`Status: ${result.status}`);
      console.log(`Feedback: ${result.feedback}`);
      
      if (result.reasons && result.reasons.length > 0) {
        console.log('Reasons:');
        result.reasons.forEach(r => console.log(`  - ${r}`));
      }
      console.log();
      console.log('📄 Full Response:');
      console.log(JSON.stringify(result, null, 2));
      return true;
    } else {
      console.error(`❌ API Error (${statusCode}):\n`);
      console.error(responseText);
      return false;
    }

  } catch (error) {
    console.error('❌ Request Failed:', error.message);
    return false;
  }
}

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

// Run test
const imagePath = process.argv[2] || './test-photo.jpg';
testScreenerAPI(imagePath).then(success => {
  process.exit(success ? 0 : 1);
});
