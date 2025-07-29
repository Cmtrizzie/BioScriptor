import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string, file?: File) => void;
  disabled?: boolean;
}

interface FilePreview {
  file: File;
  preview?: string;
  type: 'text' | 'image' | 'bio';
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // File type detection
  const getFileType = (file: File): 'text' | 'image' | 'bio' => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['fasta', 'gb', 'pdb', 'csv'].includes(ext || '')) return 'bio';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return 'image';
    return 'text';
  };

  // Handle file addition
  const addFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    const fileType = getFileType(file);
    let preview = '';

    if (fileType === 'image') {
      preview = URL.createObjectURL(file);
    } else if (fileType === 'text' || fileType === 'bio') {
      const text = await file.text();
      preview = text.substring(0, 200) + (text.length > 200 ? '...' : '');
    }

    const filePreview: FilePreview = { file, preview, type: fileType };
    setFiles(prev => [...prev, filePreview]);
  }, []);

  // Handle paste events
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || []);
    let hasImage = false;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          hasImage = true;
          await addFile(file);
        }
      }
    }

    // Only prevent default for images, let text paste work normally
    // This prevents the duplicate paste issue
  }, [addFile]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await addFile(file);
    }
  }, [addFile]);

  // Submit handler
  const handleSubmit = () => {
    if ((!message.trim() && files.length === 0) || disabled || isComposing) return;

    onSendMessage(message, files[0]?.file);
    setMessage("");
    setFiles([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Keyboard handler with composition support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }

    
  };

  

  // File input handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    for (const file of selectedFiles) {
      // Check file type for bioinformatics files
      const validExtensions = ['.fasta', '.fa', '.fastq', '.fq', '.vcf', '.gtf', '.gff', '.pdb', '.txt', '.csv', '.tsv', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const fileName = file.name.toLowerCase();
      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));

      if (!isValidFile) {
        alert(`Unsupported file type. Supported formats: ${validExtensions.join(', ')}`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }

      await addFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Setup paste listener
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('paste', handlePaste);
      return () => textarea.removeEventListener('paste', handlePaste);
    }
  }, [handlePaste]);

  return (
    <div 
      ref={dropZoneRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 transition-colors shadow-lg",
        isDragging && "bg-bio-blue/5 border-bio-blue"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-4xl mx-auto">
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-bio-blue/10 border-2 border-dashed border-bio-blue rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <svg className="w-12 h-12 text-bio-blue mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-bio-blue font-medium">Drop files here</p>
              <p className="text-sm text-gray-500">Supports .fasta, .gb, .pdb, .csv, images</p>
            </div>
          </div>
        )}

        {/* File previews */}
        {files.length > 0 && (
          <div className="mb-3 space-y-2">
            {files.map((filePreview, index) => (
              <div key={index} className="flex items-start justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* File type icon */}
                  <div className="flex-shrink-0">
                    {filePreview.type === 'image' ? (
                      <img src={filePreview.preview} alt="Preview" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className={cn(
                        "w-12 h-12 rounded flex items-center justify-center",
                        filePreview.type === 'bio' ? "bg-bio-teal/10 text-bio-teal" : "bg-blue-100 text-blue-600"
                      )}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* File details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium truncate">{filePreview.file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {filePreview.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {(filePreview.file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    {filePreview.preview && filePreview.type !== 'image' && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono leading-relaxed">
                        {filePreview.preview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 ml-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        

        <div className="flex items-end space-x-2">

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".fasta,.gb,.pdb,.csv,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileChange}
            multiple
            className="hidden"
          />

          {/* Message Input Container */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="Ask biobuddy about DNA sequences, protein analysis, molecular biology... (Shift+Enter for new line)"
              className="w-full pl-12 pr-14 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-bio-blue dark:focus:ring-bio-teal focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[52px] max-h-[200px] overflow-y-auto shadow-sm"
              rows={1}
              disabled={disabled}
            />

            {/* File Upload Button - Inside Input */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="absolute left-2 bottom-2 text-gray-500 hover:text-bio-blue dark:hover:text-bio-teal h-8 w-8"
              title="Upload file (.fasta, .gb, .pdb, .csv, images)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSubmit}
              disabled={(!message.trim() && files.length === 0) || disabled || isComposing}
              size="icon"
              className="absolute right-2 bottom-2 bg-bio-blue hover:bg-bio-blue/90 disabled:bg-gray-300 text-white rounded-xl transition-colors h-8 w-8"
              title="Send message (Enter)"
            >
              {disabled ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        {/* Input Help Text */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <div className="flex items-center space-x-4 flex-wrap">
            <span>Enter to send • Shift+Enter for new line</span>
            <span className="flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Drag & drop files • Paste images</span>
            </span>
            <span className="hidden sm:inline">Web search available</span>
          </div>
          <span className="text-bio-teal font-medium">Free Tier</span>
        </div>
      </div>
    </div>
  );
}