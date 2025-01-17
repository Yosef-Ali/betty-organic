import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useDropzone } from 'react-dropzone'

interface ProfileImageSectionProps {
  profileImageUrl: string
  fullName: string
  profileDropzone: ReturnType<typeof useDropzone>
  removeImage: (type: 'cover' | 'profile') => void
}

const ProfileImageSection: React.FC<ProfileImageSectionProps> = ({ profileImageUrl, fullName, profileDropzone, removeImage }) => {
  return (
    <section>
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src={profileImageUrl || undefined}
            alt={fullName}
          />
          <AvatarFallback>
            {fullName ? fullName[0].toUpperCase() : "A"}
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <div {...profileDropzone.getRootProps()}>
            <input {...profileDropzone.getInputProps()} />
            <Button type="button" variant="outline">Change</Button>
          </div>
          {profileImageUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={() => removeImage('profile')}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

export default ProfileImageSection
