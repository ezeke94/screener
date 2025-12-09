// Secure proxy: frontend calls this WITHOUT an API key.
// This function validates the request and calls the real analyze function
// with the API key injected server-side.

export default async (req: Request, context: any) => {
  // 1. Allow browser preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': process.env.TALC_ALLOWED_ORIGINS?.split(',')[0] || '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  // 2. Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 3. Parse and validate request
    const body = await req.json();
    const { imageBase64, mimeType, criteria } = body;

    if (!imageBase64 || !criteria) {
      return new Response(JSON.stringify({ error: "Bad Request: Missing 'imageBase64' or 'criteria'" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Call the real analyze function server-side with API key injected
    const apiKey = process.env.TALC_API_KEY;
    if (!apiKey) {
      console.error('Server config error: TALC_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Server Configuration Error: TALC_API_KEY is missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Forward to the real analyze function with API key in header
    const analyzeUrl = `${req.url.split('/.netlify')[0]}/.netlify/functions/analyze`;
    const analyzeResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-talc-api-key': apiKey
      },
      body: JSON.stringify({ imageBase64, mimeType, criteria })
    });

    const responseText = await analyzeResponse.text();

    // Return response with CORS headers
    return new Response(responseText, {
      status: analyzeResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.TALC_ALLOWED_ORIGINS?.split(',')[0] || '*'
      }
    });

  } catch (error: any) {
    console.error('Proxy Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
