'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TestimonialTable } from '../testimonials/TestimonialTable';
import { EditTestimonialForm } from '../testimonials/EditTestimonialForm';

export function SettingsTestimonials() {
  const router = useRouter();
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsAddingTestimonial(false);
  };

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Testimonials</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => setIsAddingTestimonial(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Testimonial</span>
          </Button>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isAddingTestimonial && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingTestimonial(false)}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                  <div>
                    <CardTitle>{isAddingTestimonial ? 'Add Testimonial' : 'Testimonials'}</CardTitle>
                    <CardDescription>
                      {isAddingTestimonial
                        ? 'Create a new testimonial'
                        : 'Manage customer testimonials that appear on the marketing page.'}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isAddingTestimonial ? (
                <EditTestimonialForm />
              ) : (
                <TestimonialTable />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Testimonials</CardTitle>
              <CardDescription>Review and approve new testimonials.</CardDescription>
            </CardHeader>
            <CardContent>
              <TestimonialTable filterStatus="pending" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Testimonials</CardTitle>
              <CardDescription>View and manage approved testimonials.</CardDescription>
            </CardHeader>
            <CardContent>
              <TestimonialTable filterStatus="approved" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
