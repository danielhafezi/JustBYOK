import OpenAI from 'openai';

// Simple static export configuration
export const dynamic = 'force-static';
export const revalidate = false;

export async function POST(req: Request) {
  try {
    console.log('Simplechat API received request');
    
    // Parse request body
    const body = await req.json();
    const { messages, apiKey, model, modelSettings } = body;
    
    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages are required' }, { status: 400 });
    }
    
    if (!apiKey) {
      return Response.json({ error: 'API key is required' }, { status: 400 });
    }
    
    if (!model) {
      return Response.json({ error: 'Model is required' }, { status: 400 });
    }
    
    console.log('Received request to simplechat API:', {
      modelRequested: model,
      messagesCount: messages.length
    });
    
    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    // Map model ID - using correct OpenAI model names
    // Our internal model names omit the hyphens
    let openAIModel: string;
    switch (model) {
      case 'gpt-4o':
        // Use the base model name without version for latest version
        openAIModel = 'gpt-4o';
        break;
      case 'gpt-4o-mini':
        openAIModel = 'gpt-4o-mini';
        break;
      case 'gpt45-preview':
        openAIModel = 'gpt-4-turbo-preview';
        break;
      default:
        // If it's already a valid OpenAI model name, use it directly
        openAIModel = model;
    }
    
    // Extract model settings with defaults from the settings dialog or use defaults if not provided
    // These settings control the behavior of the AI model
    const temperature = modelSettings?.temperature ?? 0.7; // Controls randomness: 0 = deterministic, 1 = creative
    const maxTokens = modelSettings?.maxTokens || 1000; // Controls max length of response
    const topP = modelSettings?.topP ?? 0.9; // Nucleus sampling (alternative to temperature)
    const frequencyPenalty = modelSettings?.frequencyPenalty ?? 0; // Penalizes repetition of tokens based on frequency
    const presencePenalty = modelSettings?.presencePenalty ?? 0; // Penalizes tokens based on presence in text so far
    const systemPrompt = modelSettings?.systemPrompt || ''; // Custom system prompt if provided
    
    // Log detailed model settings information
    console.log('Received model settings:', modelSettings ? 'yes' : 'no');
    if (modelSettings) {
      console.log('Model settings details:', {
        temperature: modelSettings.temperature,
        maxTokens: modelSettings.maxTokens,
        topP: modelSettings.topP,
        frequencyPenalty: modelSettings.frequencyPenalty,
        presencePenalty: modelSettings.presencePenalty,
        systemPrompt: modelSettings.systemPrompt ? 'custom' : 'none',
      });
    }
    
    // Log API request parameters
    console.log('Calling OpenAI with model:', openAIModel);
    console.log('API request parameters:', {
      model: openAIModel,
      messagesCount: messages.length,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      system_prompt: systemPrompt ? 'Custom system prompt provided' : 'No custom system prompt',
      stream: true
    });
    
    // Modify the messages array if a system prompt is provided in the model settings
    let finalMessages = [...messages];
    if (systemPrompt && messages.length > 0 && messages[0].role !== 'system') {
      finalMessages = [{ role: 'system', content: systemPrompt }, ...messages];
    }
    
    try {
      // Create a streaming response with all the model parameters
      const stream = await openai.chat.completions.create({
        model: openAIModel,
        messages: finalMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stream: true,
      });
      
      console.log('OpenAI stream created successfully');
      
      // Create a streaming response
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          try {
            console.log('Starting stream processing');
            let chunkCount = 0;
            
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              chunkCount++;
              
              if (content) {
                // Format as SSE
                const formattedChunk = {
                  type: 'text',
                  value: content
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(formattedChunk)}\n\n`));
                
                if (chunkCount % 10 === 0) {
                  console.log(`Processed ${chunkCount} chunks`);
                }
              }
            }
            
            console.log(`Stream complete, processed ${chunkCount} chunks total`);
            
            // Send done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error: any) {
            console.error('Streaming error:', error);
            
            // Send error message
            const errorChunk = {
              type: 'error',
              value: error.message || 'Error in stream processing'
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
            controller.close();
          }
        }
      });
      
      console.log('Returning stream response');
      
      // Return the stream
      return new Response(customStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
      
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);
      
      // Provide more detailed error information
      let errorMessage = 'An error occurred while generating the response.';
      let statusCode = 500;
      
      if (error.status === 400) {
        errorMessage = `Bad request error: ${error.message || 'Invalid request parameters'}`;
        statusCode = 400;
      } else if (error.status === 401) {
        errorMessage = 'Authentication error: Invalid API key';
        statusCode = 401;
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded: Too many requests';
        statusCode = 429;
      } else if (error.status === 404) {
        errorMessage = `Model not found: ${openAIModel} is not available or doesn't exist`;
        statusCode = 404;
      }
      
      return Response.json({ error: errorMessage }, { status: statusCode });
    }
    
  } catch (error: any) {
    console.error('Error in simplechat API:', error);
    return Response.json({ 
      success: false,
      error: `An error occurred processing your request: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 