"use client";

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

interface ScanResult {
  id: string;
  filename: string;
  scan_date: string;
  scan_result: string;
  virus_name?: string;
  status: string;
}

const ScanDetails: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scanDetails, setScanDetails] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScanDetails = async () => {
      if (!scanId) {
        setError("No scan ID provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .eq('id', scanId)
        .single();

      if (error) {
        console.error("Error fetching scan details:", error);
        setError("Failed to load scan details.");
      } else if (!data) {
        setError("Scan result not found.");
      } else {
        setScanDetails(data);
      }
      setLoading(false);
    };

    fetchScanDetails();
  }, [scanId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading scan details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
        <Button asChild variant="link" className="mt-4">
          <Link to="/history">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan History
          </Link>
        </Button>
      </div>
    );
  }

  if (!scanDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">No scan details available.</p>
        <Button asChild variant="link" className="mt-4">
          <Link to="/history">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan History
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Scan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {scanDetails.filename}
            </h3>
            <Badge variant={scanDetails.scan_result.startsWith("infected") ? "destructive" : "default"}>
              {scanDetails.scan_result}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Scan ID:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">{scanDetails.id}</p>
            </div>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Scan Date:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(scanDetails.scan_date), 'yyyy-MM-dd HH:mm:ss')}
              </p>
            </div>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">{scanDetails.status}</p>
            </div>
            {scanDetails.virus_name && (
              <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Virus Name:</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">{scanDetails.virus_name}</p>
              </div>
            )}
          </div>
          <Button asChild variant="outline" className="w-full mt-4">
            <Link to="/history">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scan History
            </Link>
          </Button>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default ScanDetails;