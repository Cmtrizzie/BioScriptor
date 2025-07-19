import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export default function FileUpload({ 
  onFileUpload, 
  accept = ".fasta,.gb,.pdb,.csv",
  maxSize = 10 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type
    const allowedTypes = accept.split(',');
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert(`Please select a file with one of these extensions: ${accept}`);
      return;
    }

    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-bio-teal dark:hover:border-bio-teal transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="text-center">
        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-bio-blue dark:text-bio-teal"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload your file
          </Button>
          {' '}or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Supports {accept} (max {maxSize}MB)
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
