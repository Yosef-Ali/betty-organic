import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PersonalInfoSectionProps {
  fullName: string
  email: string
  setFormData: React.Dispatch<React.SetStateAction<{
    fullName: string
    email: string
    coverImage: File | null
    profileImage: File | null
    coverImageUrl: string
    profileImageUrl: string
  }>>
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ fullName, email, setFormData }) => {
  return (
    <section>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="Enter your full name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
            disabled
          />
        </div>
      </div>
    </section>
  )
}

export default PersonalInfoSection
