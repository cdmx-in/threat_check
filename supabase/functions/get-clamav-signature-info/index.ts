import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simulate fetching real ClamAV signature information
    // In a real-world scenario, this would query a ClamAV instance or a database
    // that stores this information.
    const signatureInfo = {
      version: "0.103.2 (Simulated)", // Updated to indicate it's simulated
      updateTimestamp: new Date().toISOString(), // Current timestamp
    };

    return new Response(JSON.stringify(signatureInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});