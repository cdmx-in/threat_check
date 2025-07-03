"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UploadCloud, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, SingleScanResponse } from "@/services/api"; // Import the new API service

// Max file size from the new API spec is 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

interface ScanResultDisplay {
  filename: string;
  status: "pending" | "uploading" | "scanning" | "clean" | "infected" | "error";
  virus_name?: string;
  progress: number;
}

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [scanResults, setScanResults] = useState<ScanResultDisplay[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large (max ${MAX_FILE_SIZE / (1024 * 1024)}MB).`);
        return false;
      }
      return true;
    });
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    setScanResults(prevResults => [
      ...prevResults,
      ...newFiles.map(file => ({
        filename: file.name,
        status: "pending",
        progress: 0,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.info("Please select files to upload.");
      return;
    }

    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const currentFileName = file.name;

      try {
        setScanResults(prev =>
          prev.map(result =>
            result.filename === currentFileName ? { ...result, status: "uploading", progress: 10 } : result
          )
        );
        toast.info(`Preparing "${currentFileName}" for scan...`);

        setScanResults(prev =>
          prev.map(result =>
            result.filename === currentFileName ? { ...result, status: "scanning", progress: 50 } : result
          )
        );
        toast.info(`Sending "${currentFileName}" for scanning...`);

        const scanData: SingleScanResponse = await api.scanFile(file);

        setScanResults(prev =>
          prev.map(result =>
            result.filename === currentFileName
              ? {
                  ...result,
                  status: scanData.scanResult.isInfected ? "infected" : "clean",
                  virus_name: scanData.scanResult.threats.length > 0 ? scanData.scanResult.threats[0] : undefined,
                  progress: 100,
                }
              : result
          )
        );
        toast.success(`Scan for "${currentFileName}" completed: ${scanData.scanResult.isClean ? "Clean" : "Infected"}.`);

      } catch (error: any) {
        console.error("Scan process failed:", error);
        toast.error(`Scan for "${currentFileName}" failed: ${error.message}`);
        setScanResults(prev =>
          prev.map(result =>
            result.filename === currentFileName
              ? { ...result, status: "error", progress: 100 }
              : result
          )
        );
      }
    }
    setUploading(false);
    setFiles([]); // Clear files after processing
  };

  const removeFile = (fileName: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setScanResults(prevResults => prevResults.filter(result => result.filename !== fileName));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Malware Scanner</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
            isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-300 bg-gray-50 dark:bg-gray-900"
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isDragActive
              ? "Drop the files here..."
              : "Drag 'n' drop some files here, or click to select files"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Max file size: {MAX_FILE_SIZE / (1024 * 1024)} MB</p>
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold">Files to Scan:</h3>
            {files.map((file, index) => (
              <div key={file.name + index} className="flex items-center justify-between p-3 border rounded-md bg-white dark:bg-gray-800">
                <span className="text-gray-800 dark:text-gray-200 truncate">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? "Processing..." : "Scan Files"}
            </Button>
          </div>
        )}

        {scanResults.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Scan Results:</h3>
            {scanResults.map((result, index) => (
              <div key={result.filename + index} className="p-4 border rounded-md bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">{result.filename}</span>
                  {result.status === "clean" && (
                    <span className="flex items-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Clean
                    </span>
                  )}
                  {result.status === "infected" && (
                    <span className="flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-1" /> Infected: {result.virus_name || "Unknown"}
                    </span>
                  )}
                  {result.status === "error" && (
                    <span className="flex items-center text-yellow-600">
                      <XCircle className="h-4 w-4 mr-1" /> Error
                    </span>
                  )}
                  {(result.status === "pending" || result.status === "uploading" || result.status === "scanning") && (
                    <span className="text-gray-500">
                      {result.status === "pending" ? "Ready to scan" : result.status === "uploading" ? "Uploading..." : "Scanning..."}
                    </span>
                  )}
                </div>
                {(result.status === "pending" || result.status === "uploading" || result.status === "scanning") && (
                  <Progress value={result.progress} className="w-full" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;