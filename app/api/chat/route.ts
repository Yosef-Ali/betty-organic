import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const supabase = await createClient();

    // First try to find a response in Supabase knowledge base
    const { data: kbResponse, error } = await supabase
      .from('knowledge_base')
      .select('response')
      .ilike('question', `%${message}%`)
      .limit(1)
      .single();

    if (!error && kbResponse) {
      return NextResponse.json({ response: kbResponse.response });
    }

    // If no knowledge base match, call Mistral API
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small',
        messages: [{
          role: 'system',
          content: `You are a helpful customer support agent for Betty Organic, a fresh organic fruit delivery service. Always respond in this structured format:
          {
            "response": "Main response text",
            "suggestions": ["Suggestion 1", "Suggestion 2"],
            "links": [{"text": "Link text", "url": "https://example.com"}]
          }
          Keep responses concise and professional.`
        }, {
          role: 'user',
          content: message
        }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const mistralData = await mistralResponse.json();
    const structuredResponse = JSON.parse(mistralData.choices[0].message.content);

    // Store the conversation in Supabase
    await supabase
      .from('chat_history')
      .insert([{
        user_message: message,
        bot_response: structuredResponse.response,
        suggestions: structuredResponse.suggestions,
        links: structuredResponse.links,
        timestamp: new Date().toISOString()
      }]);

    return NextResponse.json(structuredResponse);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
