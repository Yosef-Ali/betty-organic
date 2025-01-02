import { fetchKnowledgeBase } from './supabase/client'

export type ChatResponse = {
  id: number;
  question: string;
  response: string;
  suggestions: string[];
  links: Record<string, string>;
  followUp?: string;
};

export const getKnowledgeBase = async (): Promise<ChatResponse[]> => {
  try {
    const data = await fetchKnowledgeBase()
    return data.map(item => ({
      id: item.id,
      question: item.question,
      response: item.response,
      suggestions: item.suggestions,
      links: item.links,
      followUp: ''
    }))
  } catch (error) {
    console.error('Error loading knowledge base:', error)
    return []
  }
}

export const findBestResponse = async (message: string): Promise<ChatResponse | null> => {
  const lowercaseMessage = message.toLowerCase()
  const knowledgeBase = await getKnowledgeBase()

  let bestMatch: ChatResponse | null = null
  let maxMatches = 0

  knowledgeBase.forEach(item => {
    const matches = item.question.toLowerCase().split(' ').filter(keyword =>
      lowercaseMessage.includes(keyword)
    ).length

    if (matches > maxMatches) {
      maxMatches = matches
      bestMatch = item
    }
  })

  return maxMatches > 0 ? bestMatch : null
}

export const getDefaultResponse = (): ChatResponse => ({
  id: 0,
  question: '',
  response: "I'm not sure about that, but I'd be happy to help you with information about our organic fruit delivery, prices, or subscription boxes! 🍎",
  suggestions: [],
  links: {},
  followUp: "What would you like to know?"
})
