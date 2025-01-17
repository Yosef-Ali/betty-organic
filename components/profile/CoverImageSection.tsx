import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'

interface CoverImageSectionProps {
  coverImageUrl: string
  coverDropzone: ReturnType<typeof useDropzone>
  removeImage: (type: 'cover' | 'profile') => void
}

const CoverImageSection: React.FC<CoverImageSectionProps> = ({ coverImageUrl, coverDropzone, removeImage }) => {
  return (
    <section>
      <div
        {...coverDropzone.getRootProps()}
        className="mt-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors"
      >
        <input {...coverDropzone.getInputProps()} />
        {coverImageUrl ? (
          <div className="relative h-32 w-full">
            <Image
              src={coverImageUrl || '/placeholder-cover.jpg'} // Add a placeholder image or use null
              alt="Cover"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation(); // Prevent dropzone from triggering
                removeImage('cover');
              }}
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop your cover image here or click to browse
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default CoverImageSection
