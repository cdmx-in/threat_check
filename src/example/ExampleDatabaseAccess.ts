import { supabase } from "@/integrations/supabase/client";

async function fetchScanResults() {
  const { data, error } = await supabase
    .from('scan_results')
    .select('*') // Select all columns
    .order('scan_date', { ascending: false }); // Order by scan date

  if (error) {
    console.error("Error fetching scan results:", error.message);
    return null;
  }
  console.log("Scan results:", data);
  return data;
}

// You can call this function from a React component's useEffect or an event handler.