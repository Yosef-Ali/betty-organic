export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
      <p className="text-gray-600">
        {`You don't have permission to view this page.`}
      </p>
    </div>
  );
}
