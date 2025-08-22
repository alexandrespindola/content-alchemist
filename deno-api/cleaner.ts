interface TranscriptRequest {
  transcript: string;
  video_url?: string;
}

interface CleanedTranscript {
  cleaned_text: string;
  word_count: number;
  estimated_duration: string;
  original_length: number;
}

function cleanTranscript(rawTranscript: string): CleanedTranscript {
  // Handle input that might be a continuous string without proper line breaks
  // First, try to normalize line breaks
  let normalizedTranscript = rawTranscript
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  
  // If no line breaks found, try to insert them before timestamps
  if (!normalizedTranscript.includes('\n')) {
    normalizedTranscript = normalizedTranscript.replace(/(\d{2}:\d{2}:\d{2}\.\d{3})/g, '\n$1');
  }
  
  const lines = normalizedTranscript.split('\n');
  let cleanedLines: string[] = [];
  
  // Extract metadata and clean text
  for (const line of lines) {
    // Skip metadata lines
    if (line.startsWith('#') || line.startsWith('http') || line.trim() === '') {
      continue;
    }
    
    // Extract text content (remove timestamps) - improved regex
    const textMatch = line.match(/^\d{2}:\d{2}:\d{2}\.\d{3}\s*(.+)$/);
    if (textMatch) {
      const text = textMatch[1].trim();
      
      // Skip filler content
      if (text === 'No text' || text === 'Lift' || text === 'clush' || text === 'A' || text === '[Music]') {
        continue;
      }
      
      // Only add non-empty text
      if (text.length > 0) {
        cleanedLines.push(text);
      }
    }
  }
  
  // Join lines with proper spacing
  const cleanedText = cleanedLines.join(' ');
  
  // Clean up common transcription artifacts
  const finalText = cleanedText
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\s+([.,!?])/g, '$1') // Remove spaces before punctuation
    .replace(/([a-z])\s+([A-Z])/g, '$1. $2') // Add periods between sentences
    .trim();
  
  // Calculate word count
  const wordCount = finalText.split(/\s+/).filter(word => word.length > 0).length;
  
  // Estimate duration (rough calculation: 150 words per minute)
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 150));
  const estimatedDuration = `${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`;
  
  return {
    cleaned_text: finalText,
    word_count: wordCount,
    estimated_duration: estimatedDuration,
    original_length: rawTranscript.length,
  };
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body: TranscriptRequest = await req.json();

    if (!body.transcript) {
      return new Response(JSON.stringify({ error: "Transcript is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const cleaned = cleanTranscript(body.transcript);

    return new Response(JSON.stringify(cleaned), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error processing transcript:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

// Health check endpoint
async function healthHandler(req: Request): Promise<Response> {
  if (req.method === "GET" && new URL(req.url).pathname === "/health") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        service: "Transcript Cleaner API",
        version: "1.0.0",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  return handler(req);
}

console.log("🚀 Transcript Cleaner API starting on port 8000...");
console.log("📝 POST / - Clean transcript");
console.log("❤️  GET  /health - Health check");

Deno.serve({ port: 8000 }, healthHandler);
