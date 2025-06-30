"use client";

import React from "react";
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

// This is mock data. In a real app, this would come from your backend API.
const mockSignatureInfo = {
  version: "0.103.2",
  updateTimestamp: "2023-10-26 12:00:00",
};

const mockScanLogs = [
  { id: 1, timestamp: "2023-10-26 10:00:00", filename: "document.pdf", scanResult: "clean", status: "success" },
  { id: 2, timestamp: "2023-10-26 10:15:30", filename: "malware.zip", scanResult: "infected: Eicar-Test-Signature", status: "success" },
  { id: 3, timestamp: "2023-10-26 10:30:00", filename: "image.jpg", scanResult: "clean", status: "success" },
  { id: 4, timestamp: "2023-10-26 10:45:10", filename: "report.docx", scanResult: "clean", status: "success" },
  { id: 5, timestamp: "2023-10-26 11:00:00", filename: "virus.exe", scanResult: "infected: Trojan.Generic", status: "success" },
  { id: 6, timestamp: "2023-10-26 11:30:00", filename: "corrupt.file", scanResult: "N/A", status: "error" },
];

const Admin: React.FC = () => {
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
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{mockSignatureInfo.version}</p>
              </div>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated:</p>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{mockSignatureInfo.updateTimestamp}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Recent Scan Logs</h3>
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
                {mockScanLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell className="font-medium">{log.filename}</TableCell>
                    <TableCell>
                      <Badge variant={log.scanResult.startsWith("infected") ? "destructive" : "default"}>
                        {log.scanResult}
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
          </div>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default Admin;