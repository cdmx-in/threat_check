"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { api, SignatureInfoResponse, SignatureUpdateHistoryEntry, SignatureUpdateResponse, SignatureHistoryResponse as SignatureHistoryApiResponse } from "@/services/api";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner"; // Ensure toast is imported

const ITEMS_PER_PAGE = 10;

const ClamAVInfo: React.FC = () => {
  const [currentSignatureInfo, setCurrentSignatureInfo] = useState<SignatureInfoResponse | null>(null);
  const [signatureHistory, setSignatureHistory] = useState<SignatureUpdateHistoryEntry[]>([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [loadingCurrentInfo, setLoadingCurrentInfo] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [updatingSignatures, setUpdatingSignatures] = useState(false);
  const [errorCurrentInfo, setErrorCurrentInfo] = useState<string | null>(null);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSignatureInfo = useCallback(async () => {
    setLoadingCurrentInfo(true);
    setErrorCurrentInfo(null);
    try {
      const data = await api.getSignatureInfo();
      console.log("Fetched current signature info:", data); // Added console log
      // Adjusted access to data.data.current and data.data.current.databases
      if (data && data.data && data.data.current && Array.isArray(data.data.current.databases)) {
        setCurrentSignatureInfo(data);
      } else {
        const errorMessage = "Received invalid data structure for current signature info. Expected 'data.current' object with 'databases' array.";
        console.error(errorMessage, data);
        setErrorCurrentInfo(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error("Error fetching current signature info:", err);
      setErrorCurrentInfo(`Failed to load current signature info: ${err.message}`);
      toast.error(`Failed to load current signature info: ${err.message}`);
    } finally {
      setLoadingCurrentInfo(false);
    }
  }, []);

  const fetchSignatureHistory = useCallback(async (page: number, search: string) => {
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response: SignatureHistoryApiResponse = await api.getSignatureHistory(ITEMS_PER_PAGE, offset, search);
      
      // Correctly access 'updates' and 'total' from the nested 'data' object
      if (response && response.data && Array.isArray(response.data.updates) && typeof response.data.pagination.total === 'number') {
        setSignatureHistory(response.data.updates);
        setTotalHistoryCount(response.data.pagination.total);
        setErrorHistory(null);
      } else {
        console.warn("API response for signature history was malformed. Received:", response);
        setErrorHistory("Invalid data format received for signature history. Expected an object with 'data.updates' (array) and 'data.pagination.total' properties.");
        setSignatureHistory([]);
        setTotalHistoryCount(0);
      }
    } catch (err: any) {
      console.error("Error fetching signature history:", err);
      setErrorHistory(`Failed to load signature history: ${err.message}`);
      toast.error(`Failed to load signature history: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchSignatureInfo();
  }, [fetchSignatureInfo]);

  useEffect(() => {
    fetchSignatureHistory(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchSignatureHistory]);

  const handleUpdateSignatures = async () => {
    setUpdatingSignatures(true);
    toast.info("Initiating signature update...");
    try {
      const response: SignatureUpdateResponse = await api.updateSignatures();
      if (response.success) {
        toast.success("ClamAV signatures updated successfully!");
        // Refresh current info and history after successful update
        fetchSignatureInfo();
        fetchSignatureHistory(currentPage, searchTerm);
      } else {
        toast.error(`Signature update failed: ${response.message || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Error updating signatures:", err);
      toast.error(`Failed to update signatures: ${err.message}`);
    } finally {
      setUpdatingSignatures(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const totalPages = Math.ceil(totalHistoryCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-4xl mx-auto shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">ClamAV Signature Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {loadingCurrentInfo ? (
            <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading current signature info...
            </div>
          ) : errorCurrentInfo ? (
            <p className="text-lg text-red-600 dark:text-red-400 text-center">{errorCurrentInfo}</p>
          ) : currentSignatureInfo && currentSignatureInfo.data && currentSignatureInfo.data.current ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">Current Signature Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Summary Cards */}
                <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">ClamAV Version:</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {currentSignatureInfo.data.current.version}
                  </p>
                </div>
                <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Signatures:</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {currentSignatureInfo.data.current.totalSignatures.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Overall Update:</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(currentSignatureInfo.data.current.lastUpdate), 'yyyy-MM-dd HH:mm:ss')}
                  </p>
                </div>
                {/* Update Signatures Button */}
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

              {/* Table for Individual Databases */}
              {currentSignatureInfo.data.current.databases && currentSignatureInfo.data.current.databases.length > 0 ? (
                <div className="mt-8"> {/* Added margin top for separation */}
                  <h4 className="text-xl font-semibold mb-4">Individual Databases</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Signatures</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSignatureInfo.data.current.databases.map((db, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{db.name}</TableCell>
                          <TableCell>{db.signatures.toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(db.lastUpdate), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No individual database information available.</p>
              )}
            </div>
          ) : null}

          <div>
            <h3 className="text-xl font-semibold mb-4">Signature Update History</h3>
            <div className="mb-4">
              <Input
                placeholder="Search history by database name or status..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
            {loadingHistory ? (
              <div className="text-center text-gray-600 dark:text-gray-400 flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading update history...
              </div>
            ) : errorHistory ? (
              <p className="text-lg text-red-600 dark:text-red-400 text-center">{errorHistory}</p>
            ) : signatureHistory.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No signature update history found.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Database</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Signatures</TableHead>
                      <TableHead>Last Updated</TableHead>
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
                          <Badge variant={entry.update_status === "SUCCESS" ? "default" : "destructive"}>
                            {entry.update_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">{entry.update_details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          isActive={currentPage === index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default ClamAVInfo;