import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

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
          role: 'user',
          content: `You are a helpful customer support agent for Betty Organic, a fresh organic fruit delivery service. Respond to this customer query in a friendly and professional manner: ${message}`
        }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const mistralData = await mistralResponse.json();
    const response = mistralData.choices[0].message.content;

    // Store the conversation in Supabase
    await supabase
      .from('chat_history')
      .insert([{
        user_message: message,
        bot_response: response,
        timestamp: new Date().toISOString()
      }]);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
