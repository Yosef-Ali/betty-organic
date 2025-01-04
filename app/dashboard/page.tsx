import AuthGuard from '@/components/AuthGuard'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {/* Add your dashboard content here */}
      </div>
    </AuthGuard>
  )
}
