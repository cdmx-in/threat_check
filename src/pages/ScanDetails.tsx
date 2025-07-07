"use client";

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { api, ScanLogEntry } from "@/services/api";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
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

const ScanDetails: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scanDetails, setScanDetails] = useState<ScanLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const fetchScanDetails = async () => {
      if (!scanId) {
        setError("No scan ID provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch all history and then find the specific scanId
        const { data, success } = await api.getScanHistory(1000); // Fetch a large enough limit to find the ID
        if (success) {
          const foundScan = data.find(scan => scan.id.toString() === scanId);
          if (foundScan) {
            setScanDetails(foundScan);
          } else {
            setError("Scan result not found.");
          }
        } else {
          setError("Failed to load scan history from API.");
        }
      } catch (err: any) {
        console.error("Error fetching scan details:", err);
        setError(`Failed to load scan details: ${err.message}`);
      } finally {
        setLoading(false);
      }
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
            <Badge 
              className={cn(
                scanDetails.scan_result === "INFECTED" && "bg-red-600 text-white hover:bg-red-700",
                scanDetails.scan_result === "CLEAN" && "bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {scanDetails.scan_result}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Scan ID:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">{scanDetails.id}</p>
            </div>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Scan Date ({getTimeZoneAbbreviation(new Date(scanDetails.scan_time), localTimeZone)}):</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(scanDetails.scan_time), 'yyyy-MM-dd HH:mm:ss')}
              </p>
            </div>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">File Size:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">{scanDetails.file_size} bytes</p>
            </div>
            {scanDetails.threats_found && scanDetails.threats_found.length > 0 && (
              <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Threats Found:</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">{scanDetails.threats_found.join(', ')}</p>
              </div>
            )}
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">MD5 Hash:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 break-all">{scanDetails.md5_hash}</p>
            </div>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">SHA1 Hash:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 break-all">{scanDetails.sha1_hash}</p>
            </div>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">SHA256 Hash:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 break-all">{scanDetails.sha256_hash}</p>
            </div>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Client IP:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">{scanDetails.client_ip}</p>
            </div>
            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">User Agent:</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 break-all">{scanDetails.user_agent}</p>
            </div>
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