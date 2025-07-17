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
import { Loader2 } from "lucide-react";
import { SignatureListResponse } from "@/services/api";

interface IndividualDatabasesTableProps {
  signatureList: SignatureListResponse | null;
  loading: boolean;
  error: string | null;
}

const IndividualDatabasesTable: React.FC<IndividualDatabasesTableProps> = ({
  signatureList,
  loading,
  error,
}) => {
  const displayDatabases = signatureList?.databases;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Individual Signature Databases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading individual databases...
          </div>
        ) : error ? (
          <p className="text-lg text-red-600 dark:text-red-400 text-center py-8">{error}</p>
        ) : displayDatabases && displayDatabases.length > 0 ? (
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
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No individual signature database information found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default IndividualDatabasesTable;