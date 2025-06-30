import { MadeWithDyad } from "@/components/made-with-dyad";
import FileUpload from "@/components/FileUpload"; // Import the new FileUpload component

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Welcome to Your Malware Scanner</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Upload files to scan them for malware.
        </p>
      </div>
      <FileUpload /> {/* Render the FileUpload component */}
      <MadeWithDyad />
    </div>
  );
};

export default Index;