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
    // Parse multipart/form-data
    const formData = await req.formData();
    const filename = formData.get('filename') as string;
    const file = formData.get('file') as File; // Deno's formData() returns a File object

    console.log("Received request for file scan:");
    console.log("Filename:", filename);
    console.log("File size:", file ? file.size : "undefined/null");
    console.log("File type:", file ? file.type : "undefined/null");

    if (!filename || !file) {
      console.error("Validation failed: Filename or file missing from FormData.");
      return new Response(JSON.stringify({ error: 'Filename and file content are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const SUPABASE_STORAGE_BUCKET = "scanned-files";
    const filePath = `${filename}`; 

    console.log(`Attempting to upload file "${filePath}" to bucket "${SUPABASE_STORAGE_BUCKET}"...`);
    // The 'file' object from formData() is already a Blob, so we can use it directly
    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(filePath, file, { // Use the File object directly
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return new Response(JSON.stringify({ error: `Failed to upload file to storage: ${uploadError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log("File uploaded to storage successfully.");

    console.log("Attempting to insert initial scan record...");
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
    console.log("Initial scan record inserted successfully. Scan ID:", scanId);

    console.log("Simulating scan result...");
    const isInfected = Math.random() > 0.8;
    const simulatedVirusName = isInfected ? "Eicar-Test-Signature" : undefined;
    const simulatedScanResult = isInfected ? "infected" : "clean";
    const simulatedStatus = 'success';
    console.log(`Simulated result: ${simulatedScanResult}, Virus: ${simulatedVirusName}`);

    console.log(`Attempting to update scan record with ID: ${scanId}`);
    const { error: updateError } = await supabase
      .from('scan_results')
      .update({
        scan_result: simulatedScanResult + (simulatedVirusName ? `: ${simulatedVirusName}` : ''),
        virus_name: simulatedVirusName,
        status: simulatedStatus,
      })
      .eq('id', scanId);

    if (updateError) {
      console.error("Error updating scan result in database:", updateError);
      return new Response(JSON.stringify({ error: 'Failed to update scan result in database.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    console.log("Scan record updated successfully.");

    return new Response(JSON.stringify({
      filename,
      scan_result: simulatedScanResult,
      virus_name: simulatedVirusName,
      status: simulatedStatus,
      scanId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Edge Function caught unhandled error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});