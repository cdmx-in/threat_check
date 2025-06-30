"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Import Link
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
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ScanResult {
  id: string;
  filename: string;
  scan_date: string;
  scan_result: string;
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
        .order('scan_date', { ascending: false });

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

  const handleDownload = async (filename: string) => {
    toast.info(`Preparing "${filename}" for download...`);
    try {
      const { data, error } = await supabase.functions.invoke('get-signed-url', {
        body: JSON.stringify({ filename }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (error) {
        throw new Error(`Download API error: ${error.message}`);
      }

      if (data && data.signedUrl) {
        window.open(data.signedUrl, '_blank');
        toast.success(`Download for "${filename}" started.`);
      } else {
        throw new Error("No signed URL received.");
      }
    } catch (err: any) {
      console.error("Error during download:", err);
      toast.error(`Failed to download "${filename}": ${err.message}`);
    }
  };

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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanHistory.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">
                      <Link to={`/history/${scan.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                        {scan.filename}
                      </Link>
                    </TableCell>
                    <TableCell>{format(new Date(scan.scan_date), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    <TableCell>
                      <Badge variant={scan.scan_result.startsWith("infected") ? "destructive" : "default"}>
                        {scan.scan_result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(scan.filename)}
                        className="flex items-center gap-1 ml-auto" // Added ml-auto for right alignment
                      >
                        <Download className="h-4 w-4" /> Download
                      </Button>
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