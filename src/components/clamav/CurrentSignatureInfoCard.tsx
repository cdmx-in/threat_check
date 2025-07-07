"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { SignatureInfoResponse } from "@/services/api";

interface CurrentSignatureInfoCardProps {
  currentSignatureInfo: SignatureInfoResponse | null;
  loadingCurrentInfo: boolean;
  errorCurrentInfo: string | null;
  updatingSignatures: boolean;
  handleUpdateSignatures: () => Promise<void>;
}

const CurrentSignatureInfoCard: React.FC<CurrentSignatureInfoCardProps> = ({
  currentSignatureInfo,
  loadingCurrentInfo,
  errorCurrentInfo,
  updatingSignatures,
  handleUpdateSignatures,
}) => {
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
        ) : currentSignatureInfo ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">ClamAV Version:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {currentSignatureInfo.data.version}
                </p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Signatures:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {currentSignatureInfo.data.totalSignatures.toLocaleString()}
                </p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Overall Update:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(currentSignatureInfo.data.lastUpdate), 'yyyy-MM-dd HH:mm:ss')}
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

            {currentSignatureInfo.data.databases && currentSignatureInfo.data.databases.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xl font-semibold mb-4">Individual Signature Databases</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Signatures</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSignatureInfo.data.databases.map((db, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{db.name}</TableCell>
                        <TableCell>{db.signatures.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(db.lastUpdate), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
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