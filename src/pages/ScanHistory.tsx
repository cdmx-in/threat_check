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
const mockScanHistory = [
  { id: 1, filename: "document.pdf", scanDate: "2023-10-26 10:00:00", scanResult: "clean" },
  { id: 2, filename: "malware.zip", scanDate: "2023-10-26 10:15:30", scanResult: "infected: Eicar-Test-Signature" },
  { id: 3, filename: "image.jpg", scanDate: "2023-10-26 10:30:00", scanResult: "clean" },
  { id: 4, filename: "report.docx", scanDate: "2023-10-26 10:45:10", scanResult: "clean" },
  { id: 5, filename: "virus.exe", scanDate: "2023-10-26 11:00:00", scanResult: "infected: Trojan.Generic" },
];

const ScanHistory: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-4xl mx-auto shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Scan Date</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockScanHistory.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">{scan.filename}</TableCell>
                  <TableCell>{scan.scanDate}</TableCell>
                  <TableCell>
                    <Badge variant={scan.scanResult.startsWith("infected") ? "destructive" : "default"}>
                      {scan.scanResult}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default ScanHistory;