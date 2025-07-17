"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { SignatureInfoResponse, SignatureListResponse } from "@/services/api"; // Import SignatureListResponse

interface CurrentSignatureInfoCardProps {
  currentSignatureInfo: SignatureInfoResponse | null;
  signatureList: SignatureListResponse | null; // New prop for detailed list
  loadingCurrentInfo: boolean;
  errorCurrentInfo: string | null;
  updatingSignatures: boolean;
  handleUpdateSignatures: () => Promise<void>;
}

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

const CurrentSignatureInfoCard: React.FC<CurrentSignatureInfoCardProps> = ({
  currentSignatureInfo,
  signatureList, // Use the new prop
  loadingCurrentInfo,
  errorCurrentInfo,
  updatingSignatures,
  handleUpdateSignatures,
}) => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Determine which data source to use for overall info and individual databases
  const displayInfo = currentSignatureInfo?.data; // Use 'data' from /signatures/info
  const displayDatabases = signatureList?.databases; // Use 'databases' from /signatures/list

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Current ClamAV Signature Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingCurrentInfo ? (
          <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading current signature info...
          </div>
        ) : errorCurrentInfo ? (
          <p className="text-lg text-red-600 dark:text-red-400 text-center py-8">{errorCurrentInfo}</p>
        ) : displayInfo ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">ClamAV Version:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {displayInfo.version}
                </p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Signatures:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {displayInfo.totalSignatures.toLocaleString()}
                </p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Overall Update ({getTimeZoneAbbreviation(new Date(displayInfo.lastUpdate), localTimeZone)}):</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(displayInfo.lastUpdate), 'yyyy-MM-dd hh:mm:ss a')}
                </p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <Button
                  onClick={handleUpdateSignatures}
                  disabled={updatingSignatures}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updatingSignatures ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Update Signatures
                    </>
                  )}
                </Button>
              </div>
            </div>

            {displayDatabases && displayDatabases.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xl font-semibold mb-4">Individual Signature Databases</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Signatures</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Build Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayDatabases.map((db, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{db.name}</TableCell>
                        <TableCell>{db.signatures.toLocaleString()}</TableCell>
                        <TableCell>{db.version}</TableCell>
                        <TableCell>{db.buildTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default CurrentSignatureInfoCard;