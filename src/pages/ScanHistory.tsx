"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { format } from "date-fns"; // For date formatting

interface ScanResult {
  id: string;
  filename: string;
  scan_date: string; // Changed to match database column name
  scan_result: string; // Changed to match database column name
  virus_name?: string;
  status: string;
}

const ScanHistory: React.FC = () => {
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScanHistory = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .order('scan_date', { ascending: false }); // Order by most recent scans first

      if (error) {
        console.error("Error fetching scan history:", error);
        setError("Failed to load scan history.");
        setLoading(false);
      } else {
        setScanHistory(data || []);
        setLoading(false);
      }
    };

    fetchScanHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading scan history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-4xl mx-auto shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          {scanHistory.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No scan results found. Upload a file to get started!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Scan Date</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanHistory.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">{scan.filename}</TableCell>
                    <TableCell>{format(new Date(scan.scan_date), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    <TableCell>
                      <Badge variant={scan.scan_result.startsWith("infected") ? "destructive" : "default"}>
                        {scan.scan_result}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default ScanHistory;