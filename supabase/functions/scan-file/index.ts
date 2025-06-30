import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    const { filename, filePath } = await req.json();

    if (!filename || !filePath) {
      return new Response(JSON.stringify({ error: 'Filename and filePath are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Initialize Supabase client with service role key for database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Simulate scan result
    const isInfected = Math.random() > 0.8; // 20% chance of infection
    const simulatedVirusName = isInfected ? "Eicar-Test-Signature" : undefined;
    const simulatedScanResult = isInfected ? "infected" : "clean";
    const simulatedStatus = 'success'; // The scan process itself was successful

    // Update the scan_results table with the result
    const { data, error: updateError } = await supabase
      .from('scan_results')
      .update({
        scan_result: simulatedScanResult + (simulatedVirusName ? `: ${simulatedVirusName}` : ''),
        virus_name: simulatedVirusName,
        status: simulatedStatus,
      })
      .eq('filename', filename) // Assuming filename is unique enough for this example
      .select();

    if (updateError) {
      console.error("Error updating scan result in database:", updateError);
      return new Response(JSON.stringify({ error: 'Failed to update scan result in database.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      filename,
      scan_result: simulatedScanResult,
      virus_name: simulatedVirusName,
      status: simulatedStatus,
      data // Return the updated row data
    }), {
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