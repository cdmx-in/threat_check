const BASE_URL = "http://localhost:3765"; // Updated to the correct host and port

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  clamav?: string;
  error?: string;
}

interface FileHashes {
  md5: string;
  sha1: string;
  sha256: string;
}

interface ScanResultDetails {
  isClean: boolean;
  isInfected: boolean;
  threats: string[];
  scanTime: string;
}

interface SingleScanResponse {
  success: boolean;
  scanId: number;
  filename: string;
  fileSize: number;
  hashes: FileHashes;
  scanResult: ScanResultDetails;
}

interface ScanLogEntry {
  id: number;
  filename: string;
  file_size: number;
  md5_hash: string;
  sha1_hash: string;
  sha256_hash: string;
  scan_result: "CLEAN" | "INFECTED";
  threats_found: string[];
  scan_time: string;
  client_ip: string;
  user_agent: string;
}

interface ScanHistoryResponse {
  success: boolean;
  count: number;
  limit: number;
  offset: number;
  data: ScanLogEntry[];
}

interface ErrorResponse {
  success: boolean;
  error: string;
  message?: string;
}

// New interfaces for ClamAV signature management
interface SignatureDatabaseInfo { // This is for the /api/signatures/info endpoint's 'signatures' array
  database: string;
  signatures: number;
}

interface CurrentSignatureInfoData { // This is the 'data' object from /api/signatures/info
  version: string;
  signatures: SignatureDatabaseInfo[];
  totalSignatures: number;
  lastUpdate: string; // date-time string
}

interface SignatureInfoResponse { // Response for /api/signatures/info
  success: boolean;
  timestamp: string; // date-time string
  data: CurrentSignatureInfoData; // The main data object is now under 'data'
}

interface SignatureUpdateHistoryEntry {
  id: number;
  database_name: string;
  version: string;
  signatures_count: number;
  last_updated: string; // date-time string
  update_status: "SUCCESS" | "FAILURE";
  update_details: string;
  file_size: number | null;
}

// Corrected SignatureHistoryResponse to match backend/src/app.js and swagger.json
interface SignatureHistoryResponse {
  success: boolean;
  timestamp: string;
  data: {
    updates: SignatureUpdateHistoryEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface SignatureUpdateResult {
  updated: boolean;
  databases: string[];
  message: string;
}

interface SignatureUpdateResponse {
  success: boolean;
  timestamp: string;
  updateResult: SignatureUpdateResult;
  before: { totalSignatures: number };
  after: { totalSignatures: number };
  message: string;
}

// New interfaces for /api/signatures/list
interface SignatureListItem {
  name: string;
  signatures: number;
  version: string;
  buildTime: string;
  filePath: string;
}

interface SignatureListResponse {
  success: boolean;
  timestamp: string;
  totalSignatures: number;
  databases: SignatureListItem[];
}


export const api = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch health status");
    }
    return response.json();
  },

  scanFile: async (file: File): Promise<SingleScanResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/api/scan/file`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to scan file");
    }
    return response.json();
  },

  getScanHistory: async (
    limit: number = 50,
    offset: number = 0
  ): Promise<ScanHistoryResponse> => {
    const response = await fetch(
      `${BASE_URL}/api/scan/history?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to fetch scan history");
    }
    return response.json();
  },

  getSignatureInfo: async (): Promise<SignatureInfoResponse> => {
    const response = await fetch(`${BASE_URL}/api/signatures/info`);
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to fetch signature information");
    }
    return response.json();
  },

  getSignatureList: async (): Promise<SignatureListResponse> => {
    const response = await fetch(`${BASE_URL}/api/signatures/list`);
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to fetch signature list");
    }
    return response.json();
  },

  getSignatureHistory: async (
    limit: number = 10,
    page: number = 1 // Changed from offset to page
  ): Promise<SignatureHistoryResponse> => {
    const response = await fetch(
      `${BASE_URL}/api/signatures/history?limit=${limit}&page=${page}` // Changed URL construction
    );
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to fetch signature information");
    }
    return response.json();
  },

  updateSignatures: async (): Promise<SignatureUpdateResponse> => {
    const response = await fetch(`${BASE_URL}/api/signatures/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // Empty body as per swagger
    });
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to update signatures");
    }
    return response.json();
  },
};

export type {
  HealthResponse,
  SingleScanResponse,
  ScanLogEntry,
  ScanHistoryResponse as ScanHistoryApiResponse,
  SignatureInfoResponse,
  SignatureDatabaseInfo, // Exported for use in CurrentSignatureInfoCard
  CurrentSignatureInfoData, // Exported for use in CurrentSignatureInfoCard
  SignatureUpdateHistoryEntry,
  SignatureHistoryResponse, // This is the new, corrected one
  SignatureUpdateResponse,
  SignatureListItem, // Exported for use in CurrentSignatureInfoCard
  SignatureListResponse,
};