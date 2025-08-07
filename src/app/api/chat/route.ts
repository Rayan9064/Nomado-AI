import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Add system prompt for hotel booking context
    const systemPrompt = {
      role: 'system' as const,
      content: `You are an AI booking assistant for a hotel booking platform. You help users:
      
      1. Search for hotels in specific cities (we have demo data for: New York, London, Paris, Tokyo, Dubai, Mumbai, Goa)
      2. Answer questions about hotel amenities, pricing, and locations
      3. Guide users through the booking process
      4. Provide travel recommendations and tips
      5. Handle booking modifications and cancellations
      
      Be helpful, friendly, and focus on hotel-related queries. If users ask about flights or other services, mention that this platform specializes in hotels but can help with general travel advice.
      
      Available cities with hotel data: New York, London, Paris, Tokyo, Dubai, Mumbai, Goa.
      Price range: ₹1,200 - ₹55,000 per night.
      Hotel types: Luxury, Business, Budget, Boutique, Resort.`
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemPrompt, ...messages],
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const data = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
