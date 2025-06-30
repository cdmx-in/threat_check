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
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

interface ScanResult {
  filename: string;
  status: "pending" | "uploading" | "scanning" | "clean" | "infected" | "error";
  virus_name?: string;
  progress: number;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const SUPABASE_STORAGE_BUCKET = "scanned-files"; // Name of your Supabase Storage bucket

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large (max 25MB).`);
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
      let scanId: string | null = null;

      try {
        // 1. Insert initial record into database
        const { data: initialData, error: insertError } = await supabase
          .from('scan_results')
          .insert([{ filename: currentFileName, scan_result: 'pending', status: 'pending' }])
          .select('id')
          .single();

        if (insertError || !initialData) {
          throw new Error(`Failed to create initial scan record: ${insertError?.message}`);
        }
        scanId = initialData.id;

        setScanResults(prev =>
          prev.map(result =>
            result.filename === currentFileName ? { ...result, status: "uploading", progress: 10 } : result
          )
        );
        toast.info(`Uploading "${currentFileName}"...`);

        // 2. Upload file to Supabase Storage
        const filePath = `${file.name}`; // You might want a more unique path
        const { error: uploadError } = await supabase.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        setScanResults(prev =>
          prev.map(result =>
            result.filename === currentFileName ? { ...result, status: "scanning", progress: 50 } : result
          )
        );
        toast.info(`File "${currentFileName}" uploaded. Scanning...`);

        // 3. Invoke Edge Function for scanning
        const { data: scanData, error: edgeFunctionError } = await supabase.functions.invoke('scan-file', {
          body: JSON.stringify({ filename: currentFileName, filePath }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (edgeFunctionError) {
          throw new Error(`Edge Function error: ${edgeFunctionError.message}`);
        }

        const { scan_result, virus_name, status } = scanData;

        setScanResults(prev =>
          prev.map(result =>
            result.filename === currentFileName
              ? {
                  ...result,
                  status: scan_result.startsWith("infected") ? "infected" : "clean",
                  virus_name: virus_name,
                  progress: 100,
                }
              : result
          )
        );
        toast.success(`Scan for "${currentFileName}" completed: ${scan_result}.`);

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
        // Update database status to error if an initial record was created
        if (scanId) {
          await supabase
            .from('scan_results')
            .update({ status: 'error', scan_result: `Error: ${error.message}` })
            .eq('id', scanId);
        }
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
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Max file size: 25 MB</p>
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
                      <XCircle className="h-4 w-4 mr-1" /> Infected: {result.virus_name}
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