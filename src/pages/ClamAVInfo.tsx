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
import { toast } from "sonner"; // Corrected import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils"; // Import cn utility
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 10; // Default items per page for both sections

const ClamAVInfo: React.FC = () => {
  const [currentSignatureInfo, setCurrentSignatureInfo] = useState<SignatureInfoResponse | null>(null);
  const [signatureHistory, setSignatureHistory] = useState<SignatureUpdateHistoryEntry[]>([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [loadingCurrentInfo, setLoadingCurrentInfo] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [updatingSignatures, setUpdatingSignatures] = useState(false);
  const [errorCurrentInfo, setErrorCurrentInfo] = useState<string | null>(null);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  
  // State for Update History tab
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [currentPageHistory, setCurrentPageHistory] = useState(1);

  // State for Recent Signatures tab
  const [signatureSearchTerm, setSignatureSearchTerm] = useState("");
  const [signaturesPerPage, setSignaturesPerPage] = useState(ITEMS_PER_PAGE);
  const [currentPageSignatures, setCurrentPageSignatures] = useState(1);

  const fetchSignatureInfo = useCallback(async () => {
    setLoadingCurrentInfo(true);
    setErrorCurrentInfo(null);
    try {
      const data = await api.getSignatureInfo();
      console.log("Fetched current signature info:", data);
      
      if (data && data.data) {
        setCurrentSignatureInfo(data);
      } else {
        const errorMessage = "API response for current signature info is missing or has an invalid 'data' object.";
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
    fetchSignatureHistory(currentPageHistory, historySearchTerm);
  }, [currentPageHistory, historySearchTerm, fetchSignatureHistory]);

  const handleUpdateSignatures = async () => {
    setUpdatingSignatures(true);
    toast.info("Initiating signature update...");
    try {
      const response: SignatureUpdateResponse = await api.updateSignatures();
      if (response.success) {
        toast.success("ClamAV signatures updated successfully!");
        fetchSignatureInfo();
        fetchSignatureHistory(currentPageHistory, historySearchTerm);
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

  // Handlers for Update History tab
  const handleHistorySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHistorySearchTerm(e.target.value);
    setCurrentPageHistory(1); // Reset history page on search
  };

  const totalPagesHistory = Math.ceil(totalHistoryCount / ITEMS_PER_PAGE);

  // Logic for Recent Signatures pagination and search
  const allSignatures = currentSignatureInfo?.data?.signatures || [];
  const filteredSignatures = allSignatures.filter(signature => {
    const lowerCaseSearchTerm = signatureSearchTerm.toLowerCase();
    return (
      signature.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      signature.type.toLowerCase().includes(lowerCaseSearchTerm) ||
      signature.database.toLowerCase().includes(lowerCaseSearchTerm) ||
      signature.status.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const totalFilteredSignatures = filteredSignatures.length;
  const totalSignaturePages = Math.ceil(totalFilteredSignatures / signaturesPerPage);
  const indexOfLastSignature = currentPageSignatures * signaturesPerPage;
  const indexOfFirstSignature = indexOfLastSignature - signaturesPerPage;
  const currentSignatures = filteredSignatures.slice(indexOfFirstSignature, indexOfLastSignature);

  // Handlers for Recent Signatures tab
  const handleSignaturesPerPageChange = (value: string) => {
    setSignaturesPerPage(Number(value));
    setCurrentPageSignatures(1); // Reset to first page when items per page changes
  };

  const handleSignatureSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignatureSearchTerm(e.target.value);
    setCurrentPageSignatures(1); // Reset to first page when search term changes
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-4xl mx-auto space-y-8 mt-8">
        <Tabs defaultValue="current-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current-info">Current Signature Info</TabsTrigger>
            <TabsTrigger value="recent-signatures">Recent Signatures</TabsTrigger>
            <TabsTrigger value="update-history">Update History</TabsTrigger>
          </TabsList>

          <TabsContent value="current-info">
            {/* Card for Current Signature Information */}
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Overall Update (IST):</p>
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
                                <TableCell>{format(new Date(db.lastUpdate), 'yyyy-MM-dd HH:mm:ss zzz')}</TableCell>
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
          </TabsContent>

          <TabsContent value="recent-signatures">
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

                    {filteredSignatures.length === 0 ? (
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
          </TabsContent>

          <TabsContent value="update-history">
            {/* Card for Signature Update History */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Signature Update History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="mb-4">
                  <Input
                    placeholder="Search history by database name or status..."
                    value={historySearchTerm}
                    onChange={handleHistorySearchChange}
                    className="w-full"
                  />
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
                            <TableCell>{format(new Date(entry.last_updated), 'yyyy-MM-dd HH:mm:ss zzz')}</TableCell>
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
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ClamAVInfo;