import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { SettingsTestimonials } from '@/components/settings/SettingsTestimonials';
import { SettingsKnowledgeBase } from '@/components/settings/SettingsKnowledgeBase';
import { SettingsGeneral } from '@/components/settings/SettingsGeneral';
import { SettingsAbout } from '@/components/settings/SettingsAbout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function SettingsPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your website settings and configurations
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-4">
            <SettingsGeneral />
          </TabsContent>
          <TabsContent value="about" className="space-y-4">
            <SettingsAbout />
          </TabsContent>
          <TabsContent value="testimonials" className="space-y-4">
            <SettingsTestimonials />
          </TabsContent>
          <TabsContent value="knowledge-base" className="space-y-4">
            <SettingsKnowledgeBase />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
