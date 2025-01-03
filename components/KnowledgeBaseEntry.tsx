import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database } from '@/lib/supabase'
type KnowledgeBaseEntry = Database['public']['Tables']['knowledge_base']['Row']

type KnowledgeBaseEntryProps = {
  entry: KnowledgeBaseEntry
  onEdit: (entry: KnowledgeBaseEntry) => void
  onDelete: (id: number) => void
}

export function KnowledgeBaseEntry({ entry, onEdit, onDelete }: KnowledgeBaseEntryProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{entry.question}</h3>
        <p className="text-sm text-gray-600 mb-2">{entry.response}</p>
        <div className="mb-2">
          <strong className="text-sm">Suggestions:</strong>
          <ul className="list-disc list-inside">
            {entry.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm">{suggestion}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong className="text-sm">Links:</strong>
          <ul className="list-disc list-inside">
            {entry.links && Object.entries(entry.links).map(([key, value]) => (
              <li key={key} className="text-sm">
                {key}: <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{value.text}</a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onEdit(entry)}>Edit</Button>
        <Button variant="destructive" onClick={() => onDelete(entry.id)}>Delete</Button>
      </CardFooter>
    </Card>
  )
}

