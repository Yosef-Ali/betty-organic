'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useKnowledgeBase, KnowledgeBaseEntry, NewKnowledgeBaseEntry } from '@/app/actions/useKnowledgeBase';

export function SettingsKnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<NewKnowledgeBaseEntry>({
    question: '',
    response: '',
    suggestions: [],
    links: []
  });

  const knowledgeBase = useKnowledgeBase();

  const loadEntries = useCallback(async () => {
    if (loading) return; // Prevent multiple simultaneous loads

    setLoading(true);
    try {
      const data = await knowledgeBase.fetchEntries();
      console.log('Received data in component:', data);
      setEntries(data);
      setError(null);
    } catch (err) {
      console.error('Error in loadEntries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [knowledgeBase, loading]);

  useEffect(() => {
    loadEntries();
    // No cleanup needed since we're preventing multiple loads
  }, []);  // Remove loadEntries from dependencies

  const handleAddEntry = async () => {
    try {
      await knowledgeBase.addEntry(newEntry);
      await loadEntries();
      setNewEntry({
        question: '',
        response: '',
        suggestions: [],
        links: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      await knowledgeBase.deleteEntry(id);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Question"
              value={newEntry.question}
              onChange={(e) => setNewEntry({ ...newEntry, question: e.target.value })}
            />
            <Textarea
              placeholder="Response"
              value={newEntry.response}
              onChange={(e) => setNewEntry({ ...newEntry, response: e.target.value })}
              rows={3}
            />
            <Button onClick={handleAddEntry}>Add Entry</Button>
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
            <div className="text-center py-4 text-gray-500">No entries found</div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{entry.question}</h3>
                      <p className="text-gray-600">{entry.response}</p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteEntry(entry.id)}
                      size="sm"
                    >
                      Delete
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
