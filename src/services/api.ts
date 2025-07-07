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
interface SignatureDatabase {
  name: string;
  signatures: number;
  lastUpdate: string; // date-time string
}

interface SignatureEntry { // New interface for individual signatures
  name: string;
  type: string;
  database: string;
  dateAdded: string; // date-time string
  status: string;
  isRepresentative: boolean;
  representativeOf: number;
}

interface CurrentSignatureInfo {
  version: string;
  databases?: SignatureDatabase[]; // Made optional
  signatures?: SignatureEntry[]; // Added new signatures array
  lastUpdate: string; // date-time string
  totalSignatures: number;
}

interface SignatureInfoResponse {
  success: boolean;
  timestamp: string; // date-time string
  data: CurrentSignatureInfo;
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

interface SignatureHistoryResponse {
  success: boolean;
  timestamp: string;
  data: {
    updates: SignatureUpdateHistoryEntry[];
    pagination: {
      total: number;
      limit: number;
      offset: number; // Keep offset here as it's what the API *returns*
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

  // Updated API function for ClamAV signature history to use 'page' instead of 'offset'
  getSignatureHistory: async (
    limit: number = 10,
    page: number = 1, // Changed from offset to page
    search: string = ""
  ): Promise<SignatureHistoryResponse> => {
    const response = await fetch(
      `${BASE_URL}/api/signatures/history?limit=${limit}&page=${page}&search=${encodeURIComponent(search)}` // Changed parameter name in URL
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
  ScanHistoryResponse,
  SignatureInfoResponse,
  SignatureDatabase,
  SignatureEntry, // Export the new interface
  CurrentSignatureInfo,
  SignatureUpdateHistoryEntry,
  SignatureHistoryResponse,
  SignatureUpdateResponse,
};