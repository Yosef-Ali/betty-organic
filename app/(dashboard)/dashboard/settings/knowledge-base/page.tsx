'use client';

import {
  useKnowledgeBase,
  KnowledgeBaseEntry,
  NewKnowledgeBaseEntry,
} from '@/app/actions/useKnowledgeBase';
import { useState, useEffect, useCallback } from 'react';

export default function SettingsKnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<NewKnowledgeBaseEntry>({
    question: '',
    response: '',
    suggestions: [],
    links: [],
  });
  const knowledgeBase = useKnowledgeBase();
  const [user, setUser] = useState(null); // Add user state

  const fetchEntries = useCallback(async () => {
    try {
      const { entries: kbEntries, user: kbUser } =
        await knowledgeBase.fetchEntries(); // Fetch user from useKnowledgeBase
      setEntries(kbEntries);
      setUser(kbUser); // Set user state
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [knowledgeBase]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAddEntry = async () => {
    if (!user?.id) {
      setError('User ID not found. Please refresh the page and try again.');
      return;
    }
    try {
      await knowledgeBase.addEntry({ ...newEntry, user_id: user.id }); // Include user_id when adding entry
      await fetchEntries();
      setNewEntry({
        question: '',
        response: '',
        suggestions: [],
        links: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      await knowledgeBase.deleteEntry(id);
      await fetchEntries();
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
            onChange={e =>
              setNewEntry({ ...newEntry, question: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Response"
            value={newEntry.response}
            onChange={e =>
              setNewEntry({ ...newEntry, response: e.target.value })
            }
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
            {entries.map(entry => (
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
