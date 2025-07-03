const BASE_URL = "http://localhost:3000"; // Using the development server URL from swagger.json

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
};

export type { HealthResponse, SingleScanResponse, ScanLogEntry, ScanHistoryResponse };