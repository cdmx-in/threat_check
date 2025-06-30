import { supabase } from "@/integrations/supabase/client";

async function invokeScanFunction(filename: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', filename);

  const { data, error } = await supabase.functions.invoke('process-file-scan', {
    body: formData,
  });

  if (error) {
    console.error("Error invoking scan function:", error.message);
    return null;
  }
  console.log("Edge Function response:", data);
  return data;
}

// You would typically call this from your FileUpload component's handleUpload function.