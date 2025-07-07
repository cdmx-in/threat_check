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
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SignatureUpdateHistoryEntry } from "@/services/api";

interface UpdateHistoryTableProps {
  signatureHistory: SignatureUpdateHistoryEntry[];
  totalHistoryCount: number;
  loadingHistory: boolean;
  errorHistory: string | null;
  historySearchTerm: string;
  handleHistorySearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  historyItemsPerPage: number;
  handleHistoryItemsPerPageChange: (value: string) => void;
  currentPageHistory: number;
  setCurrentPageHistory: React.Dispatch<React.SetStateAction<number>>;
  totalPagesHistory: number;
}

// Helper function to get timezone abbreviation
const getTimeZoneAbbreviation = (date: Date, timeZone: string) => {
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

const UpdateHistoryTable: React.FC<UpdateHistoryTableProps> = ({
  signatureHistory,
  totalHistoryCount,
  loadingHistory,
  errorHistory,
  historySearchTerm,
  handleHistorySearchChange,
  historyItemsPerPage,
  handleHistoryItemsPerPageChange,
  currentPageHistory,
  setCurrentPageHistory,
  totalPagesHistory,
}) => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Signature Update History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <Input
            placeholder="Search history by database name or status..."
            value={historySearchTerm}
            onChange={handleHistorySearchChange}
            className="w-full sm:w-2/3"
          />
          <div className="flex items-center space-x-2 w-full sm:w-1/3 justify-end">
            <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
            <Select value={String(historyItemsPerPage)} onValueChange={handleHistoryItemsPerPageChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {loadingHistory ? (
          <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading update history...
          </div>
        ) : errorHistory ? (
          <p className="text-lg text-red-600 dark:text-red-400 text-center py-8">{errorHistory}</p>
        ) : signatureHistory.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No signature update history found.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Database</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Last Updated ({getTimeZoneAbbreviation(new Date(), localTimeZone)})</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signatureHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.database_name}</TableCell>
                    <TableCell>{entry.version.split('/')[0]}</TableCell>
                    <TableCell>{entry.signatures_count.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(entry.last_updated), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          entry.update_status.toUpperCase() === "SUCCESS" && "bg-green-600 text-white hover:bg-green-700",
                          entry.update_status.toUpperCase().includes("FAIL") && "bg-red-600 text-white hover:bg-red-700"
                        )}
                      >
                        {entry.update_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">{entry.update_details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPagesHistory > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPageHistory(prev => Math.max(1, prev - 1))}
                      disabled={currentPageHistory === 1}
                    />
                  </PaginationItem>
                  {[...Array(totalPagesHistory)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        isActive={currentPageHistory === index + 1}
                        onClick={() => setCurrentPageHistory(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPageHistory(prev => Math.min(totalPagesHistory, prev + 1))}
                      disabled={currentPageHistory === totalPagesHistory}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UpdateHistoryTable;