export default function AuthError() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="mb-4">Sorry, there was a problem authenticating your account.</p>
        <a href="/" className="text-blue-500 hover:text-blue-700">
          Return to Home
        </a>
      </div>
    </div>
  )
}
