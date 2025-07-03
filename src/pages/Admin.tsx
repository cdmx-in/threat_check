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
import { api, ScanLogEntry, HealthResponse } from "@/services/api"; // Import the new API service
import { format } from "date-fns";
import { toast } from "sonner";

const Admin: React.FC = () => {
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
  const [signatureInfo, setSignatureInfo] = useState<HealthResponse | null>(null);
  const [totalScans, setTotalScans] = useState<number | null>(null);
  const [infectedScans, setInfectedScans] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch scan history for logs and counts
        const { data: historyData, count: totalCount, success: historySuccess } = await api.getScanHistory(10); // Limit to 10 for recent logs
        if (historySuccess) {
          setScanLogs(historyData || []);
          setTotalScans(totalCount);
          const infectedCount = historyData.filter(log => log.scan_result === "INFECTED").length;
          setInfectedScans(infectedCount);
        } else {
          setError("Failed to load scan logs and statistics.");
        }

        // Fetch health information for ClamAV signature
        const healthData = await api.getHealth();
        setSignatureInfo(healthData);

      } catch (err: any) {
        console.error("Error fetching admin data:", err);
        setError(`Failed to load admin data: ${err.message}`);
        toast.error(`Failed to load admin data: ${err.message}`);
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
            <h3 className="text-xl font-semibold mb-4">Scan Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Files Scanned:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {totalScans !== null ? totalScans : "N/A"}
                </p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Infected Files:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {infectedScans !== null ? infectedScans : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">ClamAV Signature Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Signature Version:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {signatureInfo?.clamav ? signatureInfo.clamav.split('/')[0] : "N/A"}
                </p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {signatureInfo ? format(new Date(signatureInfo.timestamp), 'yyyy-MM-dd HH:mm:ss') : "N/A"}
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
                    <TableHead>Client IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.scan_time), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                      <TableCell className="font-medium">{log.filename}</TableCell>
                      <TableCell>
                        <Badge variant={log.scan_result === "INFECTED" ? "destructive" : "default"}>
                          {log.scan_result}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.client_ip}</TableCell>
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