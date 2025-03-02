'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/app/actions/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import {
  getKnowledgeBaseEntries,
  deleteKnowledgeBaseEntry,
  createKnowledgeBaseEntry,
} from '@/app/actions/knowledge-base-actions';

import { useToast } from '@/hooks/use-toast';

type KnowledgeBaseEntryType = {
  id: number;
  question: string;
  response: string;
  suggestions: string[];
  links: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export function SettingsKnowledgeBase() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<KnowledgeBaseEntryType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ question: '', response: '' });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function fetchEntries() {
    setLoading(true);
    try {
      const fetchedEntries = await getKnowledgeBaseEntries();
      setEntries(fetchedEntries);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to fetch entries',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleAddEntry = async () => {
    if (!newEntry.question.trim() || !newEntry.response.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Both question and response are required',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const createdEntry = await createKnowledgeBaseEntry({
        question: newEntry.question.trim(),
        response: newEntry.response.trim(),
        suggestions: [], // Required field
        links: {}, // Required field
      });

      // Reset form
      setNewEntry({ question: '', response: '' });
      // Refresh entries list
      await fetchEntries();

      toast({
        title: 'Success',
        description: 'Knowledge base entry created successfully',
      });
    } catch (err: any) {
      console.error('Create error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to create entry',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      setError(null);
      setDeletingId(id);
      await deleteKnowledgeBaseEntry(id);
      await fetchEntries();
      toast({
        title: 'Success',
        description: 'Entry deleted successfully',
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message?.includes('Row level security')
          ? 'You can only delete your own entries'
          : 'Failed to delete entry - ' + (err?.message || 'Unknown error'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Question"
              value={newEntry.question}
              onChange={e =>
                setNewEntry({ ...newEntry, question: e.target.value })
              }
              disabled={isSubmitting}
            />
            <Textarea
              placeholder="Response"
              value={newEntry.response}
              onChange={e =>
                setNewEntry({ ...newEntry, response: e.target.value })
              }
              rows={3}
              disabled={isSubmitting}
            />
            <Button onClick={handleAddEntry} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No entries found
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => (
                <div key={entry.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{entry.question}</h3>
                      <p className="text-gray-600">{entry.response}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteEntry(entry.id)}
                      size="sm"
                      className="flex items-center text-red-500"
                      disabled={deletingId === entry.id}
                    >
                      <Trash2 className="h-5 w-5 mr-1 text-red-500" />
                      {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
