'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from 'lucide-react'; // Import Lucide React icon
import { getKnowledgeBaseEntries, deleteKnowledgeBaseEntry } from '@/app/actions/knowledge-base-actions';
import { Database } from '@/lib/supabase';

type KnowledgeBaseEntryType = Database['public']['Tables']['knowledge_base']['Row']

export function SettingsKnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeBaseEntryType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState({ question: '', response: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEntries().catch(err => setError(err instanceof Error ? err.message : 'Failed to fetch entries'))
  }, [])

  async function fetchEntries() {
    setLoading(true)
    try {
      const fetchedEntries = await getKnowledgeBaseEntries()
      setEntries(fetchedEntries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entries')
    } finally {
      setLoading(false)
    }
  }

  console.log('Entries:', entries)

  const handleAddEntry = async () => {
    // Logic to add a new entry
  }

  const handleDeleteEntry = async (id: number) => {
    try {
      await deleteKnowledgeBaseEntry(id)
      fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
    }
  }

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
                      variant="outline"
                      onClick={() => handleDeleteEntry(entry.id)}
                      size="sm"
                      className="flex items-center text-red-500" // Change text color to a lighter red
                    >
                      <Trash2 className="h-5 w-5 mr-1 text-red-500" /> {/* Change icon color to a lighter red */}
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
