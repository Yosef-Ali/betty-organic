'use client';

import { Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SettingsGeneral } from '@/components/settings/SettingsGeneral';
import { SettingsKnowledgeBase } from '@/components/settings/SettingsKnowledgeBase';
import { SettingsTestimonials } from '@/components/settings/SettingsTestimonials';

export default function SettingsPage() {
  return (
    <>
      <Suspense fallback={<div>Loading settings...</div>}>
        <div className="flex-1 space-y-4 px-8">
          <h2 className="text-2xl font-bold">Settings</h2>

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <SettingsGeneral />
            </TabsContent>

            <TabsContent value="knowledge-base">
              <SettingsKnowledgeBase />
            </TabsContent>

            <TabsContent value="testimonials">
              <SettingsTestimonials />
            </TabsContent>
          </Tabs>
        </div>
      </Suspense>
    </>
  );
}
