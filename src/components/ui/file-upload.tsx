import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";

export const FileUpload = ({
  onChange,
  accept,
  maxSize,
}: {
  onChange?: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    // Validate file type if accept is specified
    if (accept && newFiles.length > 0) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const file = newFiles[0];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        return mimeType === type || mimeType.startsWith(type.replace('*', ''));
      });
      
      if (!isValidType) {
        toast.error(`Invalid file type. Only ${accept} files are allowed.`);
        return;
      }
    }
    
    // Validate file size if maxSize is specified
    if (maxSize && newFiles.length > 0) {
      const file = newFiles[0];
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
        toast.error(`File size exceeds ${maxSizeMB}MB limit.`);
        return;
      }
    }
    
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange && onChange(newFiles);
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      //console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        className={cn(
          "relative block rounded-lg cursor-pointer w-full overflow-hidden transition-all duration-300",
          "border-2 border-dashed",
          isDragActive 
            ? "border-[var(--third-color)] bg-[var(--third-color)]/10 shadow-[0_0_30px_rgba(100,204,197,0.4)]" 
            : "border-[var(--third-color)]/40 bg-[var(--second-color)]/20 hover:border-[var(--third-color)] hover:shadow-[0_0_20px_rgba(100,204,197,0.3)]"
        )}
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept={accept}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        
        <div className="p-8 flex flex-col items-center justify-center">
          <motion.div
            animate={{
              y: isDragActive ? -10 : 0,
              scale: isDragActive ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
              isDragActive 
                ? "bg-[var(--third-color)]/30 shadow-[0_0_25px_rgba(100,204,197,0.6)]" 
                : "bg-[var(--third-color)]/20 shadow-[0_0_15px_rgba(100,204,197,0.3)]"
            )}
          >
            <IconUpload 
              className={cn(
                "w-8 h-8 transition-all duration-300",
                isDragActive ? "text-[var(--third-color)]" : "text-[var(--third-color)]/80"
              )} 
            />
          </motion.div>

          <p className="font-semibold text-[var(--forth-color)] text-lg mb-2">
            {isDragActive ? "Drop your file here" : "Upload file"}
          </p>
          <p className="text-[var(--forth-color)]/70 text-sm text-center">
            Drag and drop your file here or click to browse
          </p>
          {(accept || maxSize) && (
            <p className="text-[var(--third-color)]/60 text-xs mt-2">
              {accept && `Accepted: ${accept}`}
              {accept && maxSize && ' • '}
              {maxSize && `Max: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`}
            </p>
          )}
          {!accept && !maxSize && (
            <p className="text-[var(--third-color)]/60 text-xs mt-2">
              Supports PDF, DOC, DOCX, and image files
            </p>
          )}
        </div>
      </motion.div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 space-y-2"
        >
          {files.map((file, idx) => (
            <motion.div
              key={"file" + idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className={cn(
                "relative overflow-hidden flex items-center justify-between p-4 rounded-lg",
                "bg-[var(--second-color)]/30 border-2 border-[var(--third-color)]/40",
                "shadow-[0_0_15px_rgba(100,204,197,0.2)] hover:shadow-[0_0_20px_rgba(100,204,197,0.3)]",
                "transition-all duration-300"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[var(--third-color)]/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(100,204,197,0.2)]">
                  <IconFile className="w-5 h-5 text-[var(--third-color)]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--forth-color)] font-medium truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[var(--forth-color)]/60 text-xs">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                    {file.type && (
                      <>
                        <span className="text-[var(--third-color)]/40">•</span>
                        <span className="text-[var(--third-color)]/70 text-xs font-medium">
                          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(idx);
                }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-3",
                  "bg-[var(--first-color)] border border-[var(--third-color)]/30",
                  "hover:bg-red-500/20 hover:border-red-500 transition-all duration-300",
                  "shadow-[0_0_10px_rgba(100,204,197,0.2)] hover:shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                )}
              >
                <IconX className="w-4 h-4 text-[var(--forth-color)]/70 hover:text-red-400 transition-colors" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};


