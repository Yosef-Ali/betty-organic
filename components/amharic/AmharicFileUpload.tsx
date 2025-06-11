"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle,
  X 
} from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  isProcessing?: boolean;
  processingProgress?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export function AmharicFileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isProcessing = false,
  processingProgress = 0,
  maxSize = 10,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF or image files.');
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(`File size exceeds ${maxSize}MB limit`);
        return;
      }

      onFileSelect(file);
      toast.success('File uploaded successfully!');
    }
  }, [acceptedTypes, maxSize, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="w-full space-y-4">
      {!selectedFile ? (
        <Card className={`transition-all duration-200 ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}`}>
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className="text-center space-y-4"
            >
              <input {...getInputProps()} />
              <div className="flex justify-center">
                <div className={`rounded-full p-4 ${
                  isDragActive ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-8 h-8 ${
                    isDragActive ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive 
                    ? "Drop your Amharic document here"
                    : "Upload Amharic Document"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, JPEG, PNG • Max {maxSize}MB
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="bg-gray-100 px-2 py-1 rounded">PDF</span>
                <span className="bg-gray-100 px-2 py-1 rounded">JPEG</span>
                <span className="bg-gray-100 px-2 py-1 rounded">PNG</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getFileIcon(selectedFile.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                  
                  {!isProcessing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onFileRemove}
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {isProcessing && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Processing...</span>
                      <span className="font-medium">{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2" />
                  </div>
                )}

                {!isProcessing && (
                  <div className="mt-2 flex items-center text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready for processing
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Requirements */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800">
                Optimal Results for Amharic Documents
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Use clear, high-resolution images (300+ DPI)</li>
                <li>• Ensure good lighting and contrast</li>
                <li>• Avoid skewed or rotated documents</li>
                <li>• PowerGeez and Abyssinica fonts work best</li>
                <li>• Single-column layouts preferred</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}