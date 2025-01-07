import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyPage() {
  return (
    <Card className="w-full max-w-lg mx-auto mt-16">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          A verification link has been sent to your email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Please click the link in the email to verify your account. If you don&apos;t see the email, check your spam folder.
        </p>
        <p className="text-sm text-muted-foreground">
          Once verified, you will be automatically redirected to sign in.
        </p>
      </CardContent>
    </Card>
  )
}
