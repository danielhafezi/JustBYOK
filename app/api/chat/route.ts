import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, apiKey, model } = await req.json();

    if (!messages) {
      return Response.json(
        { error: 'Missing messages' },
        { status: 400 }
      );
    }

    // Determine provider based on model ID
    let provider: 'openai' | 'anthropic' | 'gemini';
    let apiModel: string;

    // Map the model ID to the provider and specific API model
    if (model === 'gpt-4o' || model === 'gpt-4o-mini' || model === 'gpt-45-preview') {
      provider = 'openai';
      // Map the model ID to the specific OpenAI API model name
      switch (model) {
        case 'gpt-4o':
          apiModel = 'gpt-4o';
          break;
        case 'gpt-4o-mini':
          apiModel = 'gpt-4o-mini';
          break;
        case 'gpt-45-preview':
          apiModel = 'gpt-4.5-preview';
          break;
        default:
          apiModel = 'gpt-4o';
      }
    } else if (model === 'claude-3-sonnet' || model === 'claude-3-sonnet-reasoning') {
      provider = 'anthropic';
      apiModel = 'claude-3-sonnet-20240229';
    } else if (model === 'gemini-flash-2') {
      provider = 'gemini';
      apiModel = 'gemini-1.5-flash';
    } else {
      // Default to OpenAI GPT-4o for any unrecognized models
      provider = 'openai';
      apiModel = 'gpt-4o';
    }

    // Check API key based on provider
    if (provider === 'openai' && !apiKey) {
      return Response.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }

    try {
      let result;

      // Process messages based on the selected provider
      switch (provider) {
        case 'openai': {
          // Store the original API key if it exists
          const originalApiKey = process.env.OPENAI_API_KEY;

          // Temporarily set the API key from the request
          process.env.OPENAI_API_KEY = apiKey;

          try {
            // Use the OpenAI API with the environment variable
            result = streamText({
              model: openai(apiModel as any),
              messages,
              temperature: 0.7,
            });

            return result.toDataStreamResponse();
          } finally {
            // Restore the original API key
            process.env.OPENAI_API_KEY = originalApiKey;
          }
        }

        case 'anthropic':
        case 'gemini':
        default:
          // For now, only supporting OpenAI
          return Response.json(
            { error: `The ${provider} provider is not currently supported with user API keys` },
            { status: 400 }
          );
      }
    } catch (error: any) {
      console.error('Error generating response:', error);
      return Response.json(
        { error: `Error generating response: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return Response.json(
      { error: `Error: ${error.message}` },
      { status: 500 }
    );
  }
}