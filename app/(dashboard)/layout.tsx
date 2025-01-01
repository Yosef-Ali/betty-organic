import { redirect } from 'next/navigation'
import { getSession } from '../../lib/auth'
import ClientLayout from '../../components/ClientLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return <ClientLayout>{children}</ClientLayout>
}
