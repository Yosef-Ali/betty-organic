import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { provider } = await req.json();

    // Get the API key for the provider
    let envKey: string;
    switch (provider) {
      case 'huggingface-diffusers':
        envKey = 'HUGGINGFACE_API_KEY';
        break;
      case 'cloudflare-workers-ai':
        envKey = 'CLOUDFLARE_API_KEY';
        break;
      case 'openai-dall-e-3':
        envKey = 'OPENAI_API_KEY';
        break;
      case 'gemini-pro-vision':
      case 'gemini-flash':
        envKey = 'GOOGLE_AI_API_KEY';
        break;
      case 'stability-ai':
        envKey = 'STABILITY_API_KEY';
        break;
      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Get API key from database
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', envKey)
      .single();

    if (!setting?.value) {
      return NextResponse.json({
        success: false,
        message: 'API key not configured'
      });
    }

    // Test the API key based on provider
    let testResult;
    switch (provider) {
      case 'huggingface-diffusers':
        testResult = await testHuggingFaceKey(setting.value);
        break;
      case 'cloudflare-workers-ai':
        testResult = await testCloudflareKey(setting.value);
        break;
      case 'openai-dall-e-3':
        testResult = await testOpenAIKey(setting.value);
        break;
      case 'gemini-pro-vision':
      case 'gemini-flash':
        testResult = await testGoogleAIKey(setting.value);
        break;
      case 'stability-ai':
        testResult = await testStabilityAIKey(setting.value);
        break;
      default:
        testResult = { success: false, message: 'Provider not supported' };
    }

    return NextResponse.json(testResult);

  } catch (error) {
    console.error('API key test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed due to server error'
    }, { status: 500 });
  }
}

async function testHuggingFaceKey(apiKey: string) {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: "test image",
        options: { wait_for_model: true }
      }),
    });

    if (response.ok || response.status === 503) { // 503 means model is loading, but key is valid
      return { success: true, message: 'Hugging Face API key is valid' };
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid Hugging Face API key' };
    } else {
      const error = await response.text();
      return { success: false, message: `Hugging Face API error: ${error}` };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to connect to Hugging Face API' 
    };
  }
}

async function testCloudflareKey(apiKey: string) {
  try {
    // Test with Cloudflare Workers AI API
    const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { success: true, message: 'Cloudflare API key is valid' };
    } else {
      const error = await response.json();
      return { 
        success: false, 
        message: `Cloudflare API error: ${error.errors?.[0]?.message || 'Invalid key'}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to connect to Cloudflare API' 
    };
  }
}

async function testOpenAIKey(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'OpenAI API key is valid' };
    } else {
      const error = await response.json();
      return { 
        success: false, 
        message: `OpenAI API error: ${error.error?.message || 'Invalid key'}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to connect to OpenAI API' 
    };
  }
}

async function testGoogleAIKey(apiKey: string) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to get a model to test the key
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Simple test prompt
    const result = await model.generateContent('Hello');
    
    if (result?.response) {
      return { success: true, message: 'Google AI API key is valid' };
    } else {
      return { success: false, message: 'Google AI API key test failed' };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: `Google AI API error: ${error.message || 'Invalid key'}` 
    };
  }
}

async function testStabilityAIKey(apiKey: string) {
  try {
    const response = await fetch('https://api.stability.ai/v1/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'Stability AI API key is valid' };
    } else {
      const error = await response.json();
      return { 
        success: false, 
        message: `Stability AI API error: ${error.message || 'Invalid key'}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to connect to Stability AI API' 
    };
  }
}
