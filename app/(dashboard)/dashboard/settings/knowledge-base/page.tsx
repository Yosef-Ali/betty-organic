'use client';

import { useState, useEffect } from 'react';
import { browserClient as supabase } from '@/lib/supabase/client';
import {
  KnowledgeBaseEntry,
  NewKnowledgeBaseEntry,
  fetchKnowledgeBaseEntries,
  addKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry
} from '@/app/actions/knowledge-base';

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<NewKnowledgeBaseEntry>({
    question: '',
    response: '',
    suggestions: [],
    links: []
  });

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const data = await fetchKnowledgeBaseEntries();
        setEntries(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load entries');
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  const handleAddEntry = async () => {
    try {
      await addKnowledgeBaseEntry(newEntry);
      const data = await fetchKnowledgeBaseEntries();
      setEntries(data);
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
      await deleteKnowledgeBaseEntry(id);
      const data = await fetchKnowledgeBaseEntries();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Knowledge Base Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Add New Entry Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Entry</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Question"
            value={newEntry.question}
            onChange={(e) => setNewEntry({ ...newEntry, question: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Response"
            value={newEntry.response}
            onChange={(e) => setNewEntry({ ...newEntry, response: e.target.value })}
            className="w-full p-2 border rounded"
            rows={3}
          />
          <button
            onClick={handleAddEntry}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Entry
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Knowledge Base Entries</h2>
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
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
