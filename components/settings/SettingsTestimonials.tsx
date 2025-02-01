'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Testimonial } from '@/lib/types';
import { TestimonialTable } from './TestimonialTable';
import { TestimonialForm } from './EditTestimonialForm';

export function SettingsTestimonials() {
  const [activeTab, setActiveTab] = useState('all');
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<
    Testimonial | undefined
  >(undefined);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsAddingTestimonial(false);
    setEditingTestimonial(undefined);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setIsAddingTestimonial(false);
  };

  const handleCancel = () => {
    setIsAddingTestimonial(false);
    setEditingTestimonial(undefined);
    setActiveTab('all');
  };

  const isEditing = Boolean(editingTestimonial);

  return (
    <main className="grid flex-1 items-start gap-4  md:gap-8">
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={handleTabChange}
      >
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
            disabled={isEditing}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Testimonial
            </span>
          </Button>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {(isAddingTestimonial || isEditing) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCancel}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Back</span>
                    </Button>
                  )}
                  <div>
                    <CardTitle>
                      {isAddingTestimonial
                        ? 'Add Testimonial'
                        : isEditing
                        ? 'Edit Testimonial'
                        : 'Testimonials'}
                    </CardTitle>
                    <CardDescription>
                      {isAddingTestimonial
                        ? 'Create a new testimonial'
                        : isEditing
                        ? 'Edit existing testimonial'
                        : 'Manage customer testimonials that appear on the marketing page.'}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isAddingTestimonial ? (
                <TestimonialForm onSuccess={handleCancel} />
              ) : isEditing ? (
                <TestimonialForm
                  initialData={editingTestimonial}
                  mode="edit"
                  onSuccess={handleCancel}
                />
              ) : (
                <TestimonialTable onEdit={handleEdit} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Testimonials</CardTitle>
              <CardDescription>
                Review and approve new testimonials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestimonialTable filterStatus="pending" onEdit={handleEdit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Testimonials</CardTitle>
              <CardDescription>
                View and manage approved testimonials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestimonialTable filterStatus="approved" onEdit={handleEdit} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
