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
    const { filename, fileContentBase64 } = await req.json();

    // Add logging to inspect received data
    console.log("Received request for file scan:");
    console.log("Filename:", filename);
    console.log("fileContentBase64 length:", fileContentBase64 ? fileContentBase64.length : "undefined/null");
    // Be careful not to log the full base64 content in production due to size/security

    if (!filename || !fileContentBase664) { // Corrected typo here
      return new Response(JSON.stringify({ error: 'Filename and base64 file content are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Initialize Supabase client with service role key for database and storage access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const SUPABASE_STORAGE_BUCKET = "scanned-files";
    const filePath = `${filename}`; // You might want a more unique path

    // Decode base64 file content
    const binaryString = atob(fileContentBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const fileBlob = new Blob([bytes], { type: 'application/octet-stream' }); // Generic binary type

    // 1. Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(filePath, fileBlob, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting for simplicity in this example
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return new Response(JSON.stringify({ error: `Failed to upload file to storage: ${uploadError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 2. Insert initial record into database
    const { data: initialData, error: insertError } = await supabase
      .from('scan_results')
      .insert([{ filename: filename, scan_result: 'pending', status: 'pending' }])
      .select('id')
      .single();

    if (insertError || !initialData) {
      console.error("Error inserting initial scan record:", insertError);
      return new Response(JSON.stringify({ error: `Failed to create initial scan record: ${insertError?.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    const scanId = initialData.id;

    // 3. Simulate scan result (integrating logic from original scan-file)
    const isInfected = Math.random() > 0.8; // 20% chance of infection
    const simulatedVirusName = isInfected ? "Eicar-Test-Signature" : undefined;
    const simulatedScanResult = isInfected ? "infected" : "clean";
    const simulatedStatus = 'success'; // The scan process itself was successful

    // 4. Update the scan_results table with the final result
    const { error: updateError } = await supabase
      .from('scan_results')
      .update({
        scan_result: simulatedScanResult + (simulatedVirusName ? `: ${simulatedVirusName}` : ''),
        virus_name: simulatedVirusName,
        status: simulatedStatus,
      })
      .eq('id', scanId); // Use the specific scanId

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
      scanId // Return the ID of the scan record
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