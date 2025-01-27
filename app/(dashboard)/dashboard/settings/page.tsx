import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { SettingsTestimonials } from '@/components/settings/SettingsTestimonials';
import { SettingsKnowledgeBase } from '@/components/settings/SettingsKnowledgeBase';
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

        <Tabs defaultValue="testimonials" className="w-full">
          <TabsList className="w-[400px]">
            <TabsTrigger value="testimonials" className="w-1/2">
              Testimonials
            </TabsTrigger>
            <TabsTrigger value="knowledge-base" className="w-1/2">
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Testimonials Management</CardTitle>
                <CardDescription>
                  Manage customer testimonials and reviews that appear on your
                  website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsTestimonials />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge-base">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                  Manage your website's knowledge base content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsKnowledgeBase />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
