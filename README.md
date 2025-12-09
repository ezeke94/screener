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
2. Create an `.env` file (or use `.env.local`) and set the following keys:

   - `API_KEY` — your Google / Gemini API key (required by the serverless function)
   - `TALC_API_KEY` — optional server-side API key the client uses to talk to the function;
     the function has a built-in default for local testing, but you should set your own secret for real deployments.

   You can copy `./.env.example` and fill in the values:
   ```powershell
   cp .env.example .env
   # then edit .env and add your real API_KEY
   ```

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

Troubleshooting
- 404 on `/.netlify/functions/analyze`: you need to run Netlify dev or functions server (see step 4).
- 500 errors from the function: ensure `API_KEY` is set in your `.env` so the function can call Gemini.
- favicon.ico 404 in the console: not critical, add a `favicon.ico` under `public/` or add a `<link rel="icon" href="/favicon.ico">` in `index.html`.
- Tailwind CDN message: the project uses the CDN build of Tailwind (`cdn.tailwindcss.com`) which is fine for local/dev use but not recommended in production — the README recommends using Tailwind as a PostCSS plugin or the Tailwind CLI for production deployments.
