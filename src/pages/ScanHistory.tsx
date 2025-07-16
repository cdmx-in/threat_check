"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { api, ScanLogEntry } from "@/services/api";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils"; // Import cn utility

// Helper function to get timezone abbreviation
const getTimeZoneAbbreviation = (date: Date, timeZone: string) => {
  // Custom mapping for common time zones that might not return desired short names
  const customAbbreviations: { [key: string]: string } = {
    "Asia/Calcutta": "IST", // Indian Standard Time
    "America/New_York": "EST", // Eastern Standard Time
    "America/Los_Angeles": "PST", // Pacific Standard Time
    // Add more as needed
  };

  if (customAbbreviations[timeZone]) {
    return customAbbreviations[timeZone];
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart ? timeZonePart.value : '';
  } catch (e) {
    console.error("Error getting timezone abbreviation:", e);
    return '';
  }
};

const ScanHistory: React.FC = () => {
  const [scanHistory, setScanHistory] = useState<ScanLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const fetchScanHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, success } = await api.getScanHistory();
        if (success) {
          setScanHistory(data || []);
        } else {
          setError("Failed to load scan history from API.");
        }
      } catch (err: any) {
        console.error("Error fetching scan history:", err);
        setError(`Failed to load scan history: ${err.message}`);
      } finally {
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
                  <TableHead>Scan Date ({getTimeZoneAbbreviation(new Date(), localTimeZone)})</TableHead>
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
                    <TableCell>{format(new Date(scan.scan_time), 'yyyy-MM-dd hh:mm:ss a')}</TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          scan.scan_result === "INFECTED" && "bg-red-600 text-white hover:bg-red-700",
                          scan.scan_result === "CLEAN" && "bg-green-600 text-white hover:bg-green-700"
                        )}
                      >
                        {scan.scan_result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end space-x-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Link to={`/history/${scan.id}`}>
                          <Eye className="h-4 w-4" /> View Details
                        </Link>
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