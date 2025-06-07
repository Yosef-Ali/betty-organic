import { getUser } from '@/app/actions/auth';
import { getProfile } from '@/app/actions/profile';
import { redirect } from 'next/navigation';
import { SettingsTestimonials } from '@/components/settings/SettingsTestimonials';
import { SettingsKnowledgeBase } from '@/components/settings/SettingsKnowledgeBase';
import { SettingsGeneral } from '@/components/settings/SettingsGeneral';
import { SettingsAbout } from '@/components/settings/SettingsAbout';
import { SettingsAIConfiguration } from '@/components/settings/SettingsAIConfiguration';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const profile = user ? await getProfile(user.id) : null;

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 space-y-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your website settings and configurations
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex gap-2 p-1 w-fit min-w-full sm:w-full">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
              <TabsTrigger value="ai-config" className="flex-1">AI Config</TabsTrigger>
              <TabsTrigger value="testimonials" className="flex-1">Testimonials</TabsTrigger>
              <TabsTrigger value="knowledge-base" className="flex-1">Knowledge Base</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="general" className="space-y-4 px-2 sm:px-0">
            <SettingsGeneral />
          </TabsContent>
          <TabsContent value="about" className="space-y-4 px-2 sm:px-0">
            <SettingsAbout />
          </TabsContent>
          <TabsContent value="ai-config" className="space-y-4 px-2 sm:px-0">
            <SettingsAIConfiguration />
          </TabsContent>
          <TabsContent value="testimonials" className="space-y-4 px-2 sm:px-0">
            <SettingsTestimonials />
          </TabsContent>
          <TabsContent value="knowledge-base" className="space-y-4 px-2 sm:px-0">
            <SettingsKnowledgeBase />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
