import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
}

export default function FileUpload({ files, setFiles }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [setFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => f !== file))
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`p-12 min-h-[300px] border-2 border-dashed rounded-lg text-center cursor-pointer ${isDragActive ? 'border-primary' : 'border-muted'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Upload className="w-16 h-16 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isDragActive ? "Drop the files here ..." : "Drag 'n' drop some files here, or click to select files"}
          </p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
              <span className="text-sm truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(file)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
