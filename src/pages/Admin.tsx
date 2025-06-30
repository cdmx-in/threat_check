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
import { toast } from "sonner"; // Import toast for notifications

interface ScanResult {
  id: string;
  filename: string;
  scan_date: string;
  scan_result: string;
  virus_name?: string;
  status: string;
}

interface SignatureInfo {
  version: string;
  updateTimestamp: string;
}

const Admin: React.FC = () => {
  const [scanLogs, setScanLogs] = useState<ScanResult[]>([]);
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Fetch scan logs
      const { data: logsData, error: logsError } = await supabase
        .from('scan_results')
        .select('*')
        .order('scan_date', { ascending: false })
        .limit(10);

      if (logsError) {
        console.error("Error fetching scan logs for admin:", logsError);
        setError("Failed to load scan logs.");
      } else {
        setScanLogs(logsData || []);
      }

      // Fetch signature information from Edge Function
      try {
        const { data: signatureData, error: signatureFunctionError } = await supabase.functions.invoke('get-clamav-signature-info');
        if (signatureFunctionError) {
          throw new Error(`Signature API error: ${signatureFunctionError.message}`);
        }
        setSignatureInfo(signatureData);
      } catch (sigErr: any) {
        console.error("Error fetching signature info:", sigErr);
        toast.error(`Failed to load signature info: ${sigErr.message}`);
        setError(prev => prev ? `${prev} Also, failed to load signature info.` : "Failed to load signature info.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading admin data...</p>
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
          <CardTitle className="text-2xl font-bold text-center">Admin Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">ClamAV Signature Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Signature Version:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {signatureInfo ? signatureInfo.version : "N/A"}
                </p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {signatureInfo ? format(new Date(signatureInfo.updateTimestamp), 'yyyy-MM-dd HH:mm:ss') : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Recent Scan Logs</h3>
            {scanLogs.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No recent scan logs found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.scan_date), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                      <TableCell className="font-medium">{log.filename}</TableCell>
                      <TableCell>
                        <Badge variant={log.scan_result.startsWith("infected") ? "destructive" : "default"}>
                          {log.scan_result}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === "error" ? "destructive" : "secondary"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default Admin;