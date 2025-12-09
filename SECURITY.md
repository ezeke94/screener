# Security guidelines for serverless functions

This project exposes a serverless function at `/.netlify/functions/analyze` to evaluate photos.
Here are important security rules and deployment checks:

1. Do not store secrets in repository code
   - Remove any hard-coded API keys from frontend code.
   - Server-side environment vars (Netlify site settings / build env) must be used.

2. API Key usage
   - `TALC_API_KEY` (server environment) is required by the Netlify function.
   - Do NOT reuse the same key in client-side code. Instead, proxy calls through server-side code or use an authenticated session exchange.

3. CORS and allowed origins
   - The function honors `TALC_ALLOWED_ORIGINS` (comma-separated). Only origins in this list will be allowed at runtime.
   - By default, no origins are allowed (deny-by-default). Please configure this to your allowed web app origin(s) in production.

4. Frontend recommendations
   - For secure deployments, do *not* embed `VITE_TALC_API_KEY` into frontend bundles for production.
   - Instead use server-side proxying or identity-based tokens (Netlify Identity / OAuth).

5. Local dev
   - For local development you can set `VITE_TALC_API_KEY` but remember it will be visible in compiled code and is not suitable for production.

6. Audit
   - Use `node ./scripts/security-check.js` to scan for common mistakes before committing.
