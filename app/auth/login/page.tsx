import SignIn from '@/components/auth/SignIn'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <SignIn />
      </div>
    </div>
  )
}
