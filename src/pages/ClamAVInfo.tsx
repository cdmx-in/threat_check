"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { api, SignatureInfoResponse, SignatureUpdateHistoryEntry, SignatureUpdateResponse, SignatureHistoryResponse, SignatureListResponse } from "@/services/api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CurrentSignatureInfoCard from "@/components/clamav/CurrentSignatureInfoCard";
import UpdateHistoryTable from "@/components/clamav/UpdateHistoryTable";
import IndividualDatabasesTable from "@/components/clamav/IndividualDatabasesTable"; // New import

const DEFAULT_ITEMS_PER_PAGE = 10; // Default items per page for both sections

const ClamAVInfo: React.FC = () => {
  const [currentSignatureInfo, setCurrentSignatureInfo] = useState<SignatureInfoResponse | null>(null);
  const [signatureList, setSignatureList] = useState<SignatureListResponse | null>(null); // State for /api/signatures/list
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
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  const fetchSignatureInfo = useCallback(async () => {
    setLoadingCurrentInfo(true);
    setErrorCurrentInfo(null);
    try {
      const infoData = await api.getSignatureInfo(); // Call /api/signatures/info
      const listData = await api.getSignatureList(); // Call /api/signatures/list

      console.log("Fetched current signature info (from /info):", infoData);
      console.log("Fetched signature list (from /list):", listData);
      
      if (infoData && infoData.data) { // Check for 'data' property
        setCurrentSignatureInfo(infoData);
      } else {
        const errorMessage = "API response for current signature info is missing or has an invalid 'data' object.";
        console.error(errorMessage, infoData);
        setErrorCurrentInfo(errorMessage);
        toast.error(errorMessage);
      }

      if (listData && listData.databases) {
        setSignatureList(listData);
      } else {
        const errorMessage = "API response for signature list is missing or has an invalid 'databases' array.";
        console.error(errorMessage, listData);
        setErrorCurrentInfo(prev => prev ? `${prev}\n${errorMessage}` : errorMessage); // Append error
        toast.error(errorMessage);
      }

    } catch (err: any) {
      console.error("Error fetching current signature info or list:", err);
      setErrorCurrentInfo(`Failed to load current signature info: ${err.message}`);
      toast.error(`Failed to load current signature info: ${err.message}`);
    } finally {
      setLoadingCurrentInfo(false);
    }
  }, []);

  const fetchSignatureHistory = useCallback(async (page: number, limit: number, search: string) => {
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      // Pass page directly instead of calculating offset
      const response: SignatureHistoryResponse = await api.getSignatureHistory(limit, page);
      
      // Correctly parse the response based on backend/src/app.js and swagger.json
      if (response && response.data && Array.isArray(response.data.updates) && typeof response.data.pagination.total === 'number') {
        setSignatureHistory(response.data.updates);
        setTotalHistoryCount(response.data.pagination.total);
        setErrorHistory(null);
        console.log("Update History Pagination Data:", {
          currentPage: response.data.pagination.page,
          itemsPerPage: response.data.pagination.limit,
          totalItems: response.data.pagination.total,
          totalPages: response.data.pagination.pages,
          fetchedItemsCount: response.data.updates.length,
        });
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
    fetchSignatureHistory(currentPageHistory, historyItemsPerPage, historySearchTerm);
  }, [currentPageHistory, historyItemsPerPage, historySearchTerm, fetchSignatureHistory]);

  const handleUpdateSignatures = async () => {
    setUpdatingSignatures(true);
    toast.info("Initiating signature update...");
    try {
      const response: SignatureUpdateResponse = await api.updateSignatures();
      if (response.success) {
        toast.success("ClamAV signatures updated successfully!");
        fetchSignatureInfo(); // Re-fetch current info and list to get latest version/counts
        fetchSignatureHistory(currentPageHistory, historyItemsPerPage, historySearchTerm); // Re-fetch history
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

  const handleHistoryItemsPerPageChange = (value: string) => {
    setHistoryItemsPerPage(Number(value));
    setCurrentPageHistory(1); // Reset to first page when items per page changes
  };

  const totalPagesHistory = Math.ceil(totalHistoryCount / historyItemsPerPage);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-4xl mx-auto space-y-8 mt-8">
        <Tabs defaultValue="current-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3"> {/* Changed grid-cols-2 to grid-cols-3 */}
            <TabsTrigger value="current-info">Current Signature Info</TabsTrigger>
            <TabsTrigger value="individual-databases">Individual Databases</TabsTrigger> {/* New Tab */}
            <TabsTrigger value="update-history">Update History</TabsTrigger>
          </TabsList>

          <TabsContent value="current-info">
            <CurrentSignatureInfoCard
              currentSignatureInfo={currentSignatureInfo}
              loadingCurrentInfo={loadingCurrentInfo}
              errorCurrentInfo={errorCurrentInfo}
              updatingSignatures={updatingSignatures}
              handleUpdateSignatures={handleUpdateSignatures}
            />
          </TabsContent>

          <TabsContent value="individual-databases"> {/* New Tab Content */}
            <IndividualDatabasesTable
              signatureList={signatureList}
              loading={loadingCurrentInfo} // Use loading state from current info fetch
              error={errorCurrentInfo} // Use error state from current info fetch
            />
          </TabsContent>

          <TabsContent value="update-history">
            <UpdateHistoryTable
              signatureHistory={signatureHistory}
              totalHistoryCount={totalHistoryCount}
              loadingHistory={loadingHistory}
              errorHistory={errorHistory}
              historySearchTerm={historySearchTerm}
              handleHistorySearchChange={handleHistorySearchChange}
              historyItemsPerPage={historyItemsPerPage}
              handleHistoryItemsPerPageChange={handleHistoryItemsPerPageChange}
              currentPageHistory={currentPageHistory}
              setCurrentPageHistory={setCurrentPageHistory}
              totalPagesHistory={totalPagesHistory}
            />
          </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ClamAVInfo;