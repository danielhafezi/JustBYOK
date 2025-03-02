import OpenAI from 'openai';

// Simple static export configuration
export const dynamic = 'force-static';
export const revalidate = false;

export async function POST(req: Request) {
  try {
    console.log('Simplechat API received request');
    
    // Parse request body
    const body = await req.json();
    const { messages, apiKey, model } = body;
    
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
      case 'gpt4o':
        openAIModel = 'gpt-4o';
        break;
      case 'gpt4o-mini':
        openAIModel = 'gpt-4o-mini';
        break;
      case 'gpt45-preview':
        openAIModel = 'gpt-4-turbo-preview';
        break;
      default:
        // If it's already a valid OpenAI model name, use it directly
        openAIModel = model;
    }
    
    console.log('Calling OpenAI with model:', openAIModel);
    
    try {
      // Create a streaming response
      const stream = await openai.chat.completions.create({
        model: openAIModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000,
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
      
    } catch (openAIError: any) {
      console.error('OpenAI API error:', openAIError);
      return Response.json({ 
        success: false,
        error: `OpenAI API error: ${openAIError.message || 'Unknown error'}` 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Error in simplechat API:', error);
    return Response.json({ 
      success: false,
      error: `An error occurred processing your request: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 