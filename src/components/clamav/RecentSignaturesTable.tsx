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
import { SignatureEntry } from "@/services/api";

interface RecentSignaturesTableProps {
  allSignatures: SignatureEntry[];
  loadingCurrentInfo: boolean;
  errorCurrentInfo: string | null;
  signatureSearchTerm: string;
  handleSignatureSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  signaturesPerPage: number;
  handleSignaturesPerPageChange: (value: string) => void;
  currentPageSignatures: number;
  setCurrentPageSignatures: React.Dispatch<React.SetStateAction<number>>;
  totalSignaturePages: number;
  currentSignatures: SignatureEntry[];
  totalFilteredSignatures: number;
}

const RecentSignaturesTable: React.FC<RecentSignaturesTableProps> = ({
  allSignatures,
  loadingCurrentInfo,
  errorCurrentInfo,
  signatureSearchTerm,
  handleSignatureSearchChange,
  signaturesPerPage,
  handleSignaturesPerPageChange,
  currentPageSignatures,
  setCurrentPageSignatures,
  totalSignaturePages,
  currentSignatures,
  totalFilteredSignatures,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Recent Signatures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingCurrentInfo ? (
          <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading recent signatures...
          </div>
        ) : errorCurrentInfo ? (
          <p className="text-lg text-red-600 dark:text-red-400 text-center py-8">{errorCurrentInfo}</p>
        ) : allSignatures.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <Input
                placeholder="Search signatures..."
                value={signatureSearchTerm}
                onChange={handleSignatureSearchChange}
                className="w-full sm:w-2/3"
              />
              <div className="flex items-center space-x-2 w-full sm:w-1/3 justify-end">
                <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
                <Select value={String(signaturesPerPage)} onValueChange={handleSignaturesPerPageChange}>
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

            {totalFilteredSignatures === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No signatures found matching your search.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Database</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSignatures.map((signature, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{signature.name}</TableCell>
                        <TableCell>{signature.type}</TableCell>
                        <TableCell>{signature.database}</TableCell>
                        <TableCell>{format(new Date(signature.dateAdded), 'yyyy-MM-dd HH:mm:ss zzz')}</TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              (signature.status.toUpperCase() === "ACTIVE" || signature.status.toUpperCase() === "SUCCESS") && "bg-green-600 text-white hover:bg-green-700",
                              signature.status.toUpperCase() === "FAILURE" && "bg-red-600 text-white hover:bg-red-700",
                              signature.status.toUpperCase() === "WARNING" && "bg-yellow-500 text-white hover:bg-yellow-600",
                              signature.status.toUpperCase() === "INFO" && "bg-blue-600 text-white hover:bg-blue-700",
                              !["ACTIVE", "SUCCESS", "FAILURE", "WARNING", "INFO"].includes(signature.status.toUpperCase()) && "bg-gray-500 text-white hover:bg-gray-600"
                            )}
                          >
                            {signature.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalSignaturePages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPageSignatures(prev => Math.max(1, prev - 1))}
                          disabled={currentPageSignatures === 1}
                        />
                      </PaginationItem>
                      {[...Array(totalSignaturePages)].map((_, index) => (
                        <PaginationItem key={index}>
                          <PaginationLink
                            isActive={currentPageSignatures === index + 1}
                            onClick={() => setCurrentPageSignatures(index + 1)}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPageSignatures(prev => Math.min(totalSignaturePages, prev + 1))}
                          disabled={currentPageSignatures === totalSignaturePages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No recent signatures found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSignaturesTable;