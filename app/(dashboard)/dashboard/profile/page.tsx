import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/ProfileForm';
import { OrderHistory } from '@/components/OrderHistory';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function ProfilePage() {
  const authData = await getCurrentUser();

  if (!authData) {
    redirect('/auth/login');
  }

  const { user, profile } = authData;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 space-y-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
            <p className="text-muted-foreground">
              Manage your account settings and view order history
            </p>
          </div>
        </div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="md:w-[400px]">
            <TabsTrigger value="profile" className="w-1/2">
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="w-1/2">
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm
                  initialName={profile?.name || ''}
                  initialEmail={profile?.email || ''}
                  initialImage={profile?.avatar_url || ''}
                  userId={user.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  View and manage your recent orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrderHistory userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
