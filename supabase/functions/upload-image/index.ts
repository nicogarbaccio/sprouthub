
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://sprouthub.netlify.app',
  'https://www.sprouthub.app',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Helper function to generate signature for signed uploads
function generateSignature(params: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const stringToSign = sortedParams + apiSecret;
  
  // Simple hash function for signature (Cloudinary uses SHA1)
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  return crypto.subtle.digest('SHA-1', data).then(hash => {
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: getCorsHeaders(req) 
      });
    }

    // Get Cloudinary configuration from environment
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    console.log('Cloud name:', cloudName);
    console.log('API key configured:', !!apiKey);
    console.log('API secret configured:', !!apiSecret);

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary configuration');
      return new Response(JSON.stringify({ 
        error: 'Cloudinary configuration missing', 
        details: {
          cloudName: !!cloudName,
          apiKey: !!apiKey,
          apiSecret: !!apiSecret
        }
      }), { 
        status: 500, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    // Get the form data from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    console.log('File received:', file.name, file.type, file.size);

    // Generate timestamp for signed upload
    const timestamp = Math.round(Date.now() / 1000).toString();
    
    // Parameters for signature (including auto-cropping transformations)
    const signatureParams = {
      timestamp,
      folder: 'plant-collection',
      crop: 'auto',
      gravity: 'auto:subject',
      quality: 'auto:eco',
      format: 'auto',
    };

    // Generate signature
    const signature = await generateSignature(signatureParams, apiSecret);
    console.log('Generated signature for upload');

    // Prepare form data for Cloudinary signed upload
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('folder', 'plant-collection');
    cloudinaryFormData.append('signature', signature);
    // Add auto-cropping transformation parameters
    cloudinaryFormData.append('crop', 'auto');
    cloudinaryFormData.append('gravity', 'auto:subject');
    cloudinaryFormData.append('quality', 'auto:eco');
    cloudinaryFormData.append('format', 'auto');

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log('Uploading to:', cloudinaryUrl);

    // Upload to Cloudinary
    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const responseText = await cloudinaryResponse.text();
    console.log('Cloudinary response status:', cloudinaryResponse.status);
    
    if (!cloudinaryResponse.ok) {
      console.error('Cloudinary error response:', responseText);
      return new Response(JSON.stringify({ 
        error: 'Upload to Cloudinary failed', 
        status: cloudinaryResponse.status,
        details: responseText 
      }), { 
        status: 500, 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    console.log('Cloudinary success response received');
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Cloudinary response:', e);
      return new Response(JSON.stringify({
        error: 'Failed to parse Cloudinary response',
        details: responseText
      }), {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      });
    }

    console.log('Upload successful, returning URL:', result.secure_url);
    return new Response(
      JSON.stringify({
        secure_url: result.secure_url,
        public_id: result.public_id,
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...getCorsHeaders(req) 
        },
      }
    );
  } catch (error) {
    console.error('Error in upload-image function:', error);
    console.error('Full error details:', error.message, error.stack);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
    }), { 
      status: 500, 
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
});
