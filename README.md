<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QRgp_0mQVt5_Rm1kGMXrrj-LJv7IQYEW

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create an `.env.local` file and configure your environment variables:

   ```powershell
   # Copy the example file
   cp .env.example .env.local
   ```

   **Required Environment Variables:**

   **Frontend (Vite - requires VITE_ prefix):**
   - `VITE_FIREBASE_API_KEY` — Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` — Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID` — Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET` — Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` — Firebase messaging sender ID
   - `VITE_FIREBASE_APP_ID` — Firebase app ID

   **Backend (Netlify Functions):**
   - `API_KEY` or `GEMINI_API_KEY` — Your Google / Gemini API key (required for AI analysis)
   - `TALC_API_KEY` — Server-side API key for securing the analyze endpoint
   - `TALC_ALLOWED_ORIGINS` — Comma-separated list of allowed CORS origins
   - `FIREBASE_PROJECT_ID` — Firebase project ID (for Firestore access)

   See `.env.example` for a complete template with all required variables.

3. Run the app for frontend-only development:

   ```powershell
   npm run dev
   ```

   Note: `npm run dev` only starts Vite's front-end dev server. If you try to call the serverless endpoint at `/.netlify/functions/*` while only running `npm run dev`, you'll see 404 errors — Vite doesn't serve Netlify functions by default.

4. Run the app with Netlify's local dev environment (recommended) so the serverless function(s) are hosted locally and available at `/.netlify/functions/analyze`:

   ```powershell
   # use npx to run the Netlify CLI temporarily (no global install)
   npx netlify dev
   ```

   Netlify CLI will start both the frontend and the functions server so your client code can call `/.netlify/functions/analyze` without 404s.

   If you prefer, run the functions server separately and proxy to it from Vite. Typical workflow:

   ```powershell
   # terminal 1 (functions server)
   npx netlify functions:serve

   # terminal 2 (frontend)
   npm run dev
   ```

## Integration for other apps

The screener is designed to be called by other applications via a secure, public API endpoint. The API uses a server-side proxy to keep all secrets safe (no API keys required from callers).

### Endpoint

```
https://screener-talc.netlify.app/.netlify/functions/proxy-analyze
```

### Request

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "imageBase64": "<base64-encoded image data>",
  "mimeType": "image/jpeg",
  "criteria": [
    {
      "id": "1",
      "label": "No strong blur",
      "type": "forbidden",
      "strictness": "High"
    },
    {
      "id": "2",
      "label": "Subject centered",
      "type": "desired"
    }
  ]
}
```

**Field Descriptions:**
- `imageBase64` (required): Base64-encoded image data (no data URI prefix, just the base64 string)
- `mimeType` (required): MIME type of the image (e.g., `image/jpeg`, `image/png`)
- `criteria` (required): Array of photo evaluation criteria
  - `id`: Unique identifier for the criterion
  - `label`: Human-readable description
  - `type`: `forbidden` (must not be present) or `desired` (nice to have)
  - `strictness`: For forbidden criteria only — `Low`, `Medium`, or `High` (controls sensitivity)

### Response

**Status:** `200 OK` (on success) or `5xx` (on error)

**Body:**
```json
{
  "status": "PASS" or "FAIL",
  "reasons": ["reason 1", "reason 2"],
  "feedback": "short tip for the photographer"
}
```

**Field Descriptions:**
- `status`: `PASS` if all forbidden criteria are absent, `FAIL` if any are detected
- `reasons`: Array of reasons why the photo failed (empty if PASS)
- `feedback`: Constructive feedback for improving the photo

### Example (JavaScript)

```javascript
async function analyzePhoto(imageFile, criteria) {
  // Convert file to base64
  const reader = new FileReader();
  reader.readAsDataURL(imageFile);
  
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1]; // Remove data URI prefix

    const response = await fetch(
      'https://screener-talc.netlify.app/.netlify/functions/proxy-analyze',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: imageFile.type || 'image/jpeg',
          criteria: criteria
        })
      }
    );

    const result = await response.json();
    
    if (result.status === 'PASS') {
      console.log('✅ Photo approved!');
    } else {
      console.log('❌ Photo rejected:', result.reasons);
      console.log('Feedback:', result.feedback);
    }
  };
}
```

### Example (cURL)

```bash
# First, encode your image to base64
# On macOS/Linux:
BASE64_IMAGE=$(base64 -w0 < photo.jpg)

# On Windows PowerShell:
# $BASE64_IMAGE = [Convert]::ToBase64String([IO.File]::ReadAllBytes('photo.jpg'))

curl -X POST https://screener-talc.netlify.app/.netlify/functions/proxy-analyze \
  -H "Content-Type: application/json" \
  -d "{
    \"imageBase64\": \"$BASE64_IMAGE\",
    \"mimeType\": \"image/jpeg\",
    \"criteria\": [
      {\"id\": \"1\", \"label\": \"No blur\", \"type\": \"forbidden\", \"strictness\": \"High\"},
      {\"id\": \"2\", \"label\": \"Centered\", \"type\": \"desired\"}
    ]
  }"
```

### Test locally

Run the integration test to verify the API is working:

```bash
npm install
npm run test-integration -- ./your-photo.jpg
```

### Error Handling

**400 Bad Request** — Missing required fields
```json
{ "error": "Bad Request: Missing 'imageBase64' or 'criteria'" }
```

**500 Internal Server Error** — AI provider error or server misconfiguration
```json
{ "error": "..." }
```

Always validate the response JSON and handle both success and error cases in your integration.Troubleshooting
- 404 on `/.netlify/functions/analyze`: you need to run Netlify dev or functions server (see step 4).
- 500 errors from the function: ensure `API_KEY` is set in your `.env` so the function can call Gemini.
- favicon.ico 404 in the console: not critical, add a `favicon.ico` under `public/` or add a `<link rel="icon" href="/favicon.ico">` in `index.html`.
- Tailwind CDN message: the project uses the CDN build of Tailwind (`cdn.tailwindcss.com`) which is fine for local/dev use but not recommended in production — the README recommends using Tailwind as a PostCSS plugin or the Tailwind CLI for production deployments.
