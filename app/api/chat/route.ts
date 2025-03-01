import { OpenAIStream, AnthropicStream, StreamingTextResponse } from 'ai';
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

    // For the smart model, analyze the messages and select the best model
    let selectedModel = model;
    
    if (model === 'smart') {
      // Simple logic to select a model based on the last user message
      const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')?.content || '';
      
      // Simple keyword-based selection (in a real app, this would be more sophisticated)
      if (lastUserMessage.toLowerCase().includes('code') || 
          lastUserMessage.toLowerCase().includes('program') ||
          lastUserMessage.toLowerCase().includes('function')) {
        selectedModel = 'openai'; // Good for code
      } else if (lastUserMessage.toLowerCase().includes('creative') || 
                lastUserMessage.toLowerCase().includes('story') ||
                lastUserMessage.toLowerCase().includes('write')) {
        selectedModel = 'anthropic'; // Good for creative writing
      } else if (lastUserMessage.toLowerCase().includes('summarize') || 
                lastUserMessage.toLowerCase().includes('explain') ||
                lastUserMessage.toLowerCase().includes('simple')) {
        selectedModel = 'gemini'; // Good for explanations
      } else {
        // Default to OpenAI for general queries
        selectedModel = 'openai';
      }
    }

    // Validate API keys
    switch (selectedModel) {
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

    // Process messages based on the selected model
    switch (selectedModel) {
      case 'openai': {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          temperature: 0.7,
          stream: true,
        });
        const stream = OpenAIStream(response);
        return new StreamingTextResponse(stream);
      }

      case 'anthropic': {
        // Convert message format for Anthropic
        const anthropicMessages = messages.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        }));

        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          messages: anthropicMessages,
          max_tokens: 1024,
          stream: true,
        });
        const stream = AnthropicStream(response);
        return new StreamingTextResponse(stream);
      }

      case 'gemini': {
        // Initialize the model
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
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

        return new StreamingTextResponse(stream);
      }

      default:
        return new Response('Invalid model', { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}