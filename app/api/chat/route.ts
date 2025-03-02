import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Create clients for each AI provider
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!messages) {
      return new Response('Missing messages', { status: 400 });
    }

    // Determine provider based on model ID
    let provider: 'openai' | 'anthropic' | 'gemini';
    let apiModel: string;
    
    // Map the model ID to the provider and specific API model
    if (model === 'gpt4o' || model === 'gpt4o-mini' || model === 'gpt45-preview') {
      provider = 'openai';
      // Map the model ID to the specific OpenAI API model name
      switch (model) {
        case 'gpt4o':
          apiModel = 'gpt-4o';
          break;
        case 'gpt4o-mini':
          apiModel = 'gpt-4o-mini';
          break;
        case 'gpt45-preview':
          apiModel = 'gpt-4.5-preview';
          break;
        default:
          apiModel = 'gpt-4o';
      }
    } else if (model === 'claude-3-sonnet' || model === 'claude-3-sonnet-reasoning') {
      provider = 'anthropic';
      // Map the model ID to the specific Anthropic API model name
      apiModel = model === 'claude-3-sonnet-reasoning' 
        ? 'claude-3-sonnet-20240229' // Use same model but we'll adjust parameters for reasoning
        : 'claude-3-sonnet-20240229';
    } else if (model === 'gemini-flash-2') {
      provider = 'gemini';
      apiModel = 'gemini-1.5-flash';
    } else {
      // Default to OpenAI GPT-4o for any unrecognized models
      provider = 'openai';
      apiModel = 'gpt-4o';
    }

    // Validate API keys
    switch (provider) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          return new Response('OpenAI API key is not configured', { status: 500 });
        }
        break;
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          return new Response('Anthropic API key is not configured', { status: 500 });
        }
        break;
      case 'gemini':
        if (!process.env.GEMINI_API_KEY) {
          return new Response('Gemini API key is not configured', { status: 500 });
        }
        break;
      default:
        return new Response('Invalid model specified', { status: 400 });
    }

    // Process messages based on the selected provider
    switch (provider) {
      case 'openai': {
        const response = await openai.chat.completions.create({
          model: apiModel,
          messages,
          temperature: 0.7,
          stream: true,
        });
        
        // Use type assertion to access the body property
        return new Response((response as any).body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }

      case 'anthropic': {
        // Convert message format for Anthropic
        const anthropicMessages = messages.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        }));

        // For reasoning variant, adjust parameters
        const temperature = model === 'claude-3-sonnet-reasoning' ? 0.1 : 0.7;

        const response = await anthropic.messages.create({
          model: apiModel,
          messages: anthropicMessages,
          max_tokens: 1024,
          temperature,
          stream: true,
        });
        
        // Create a ReadableStream from the Anthropic stream
        const stream = new ReadableStream({
          async start(controller) {
            for await (const chunk of response) {
              if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                controller.enqueue(new TextEncoder().encode(chunk.delta.text));
              }
            }
            controller.close();
          },
        });
        
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }

      case 'gemini': {
        // Initialize the model
        const model = genAI.getGenerativeModel({ model: apiModel });
        
        // Format messages for Gemini
        const formattedMessages = messages.map((msg: any) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }));

        // Create a chat session
        const chat = model.startChat({
          history: formattedMessages,
        });

        // Generate streaming response
        const result = await chat.sendMessageStream('');
        
        // Convert stream to readable stream
        const stream = new ReadableStream({
          async start(controller) {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }

      default:
        return new Response('Invalid model', { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}