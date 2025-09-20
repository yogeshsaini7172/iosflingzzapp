// Robust OpenAI client wrapper with retries, exponential backoff, model fallback, and error handling

const DEFAULT_MODELS = ['gpt-4o-mini', 'gpt-4.1-mini-2025-04-14', 'gpt-5-mini-2025-08-07', 'gpt-4o'];
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000; // 1 second

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface OpenAIRequest {
  apiKey: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
  parseJson?: boolean;
}

export interface OpenAIResponse {
  model: string;
  rawResponse: any;
  parsedContent: any;
}

/**
 * sendOpenAIRequest - robust function that:
 * - tries multiple models in order
 * - exponential backoff retries on transient errors
 * - returns parsed JSON or throws an error with debug info
 */
export async function sendOpenAIRequest({
  apiKey,
  model,
  messages,
  maxTokens = 800,
  temperature = 0.0,
  parseJson = true
}: OpenAIRequest): Promise<OpenAIResponse> {
  if (!apiKey) throw new Error('Missing OpenAI API key');

  const modelsToTry = model ? [model, ...DEFAULT_MODELS.filter(m => m !== model)] : DEFAULT_MODELS;
  let lastError: any = null;

  for (const tryModel of modelsToTry) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Prepare request body based on model capabilities
        const requestBody: any = {
          model: tryModel,
          messages,
        };

        // Use max_completion_tokens for newer models, max_tokens for older ones
        if (tryModel.includes('gpt-5') || tryModel.includes('gpt-4.1') || tryModel.includes('o3') || tryModel.includes('o4')) {
          requestBody.max_completion_tokens = maxTokens;
          // Don't include temperature for newer models (not supported)
        } else {
          requestBody.max_tokens = maxTokens;
          requestBody.temperature = temperature;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        const raw = await response.text();
        console.log(`OpenAI ${tryModel} attempt ${attempt + 1}: status=${response.status}, rawLength=${raw.length}`);
        
        // Save raw response for debugging
        let parsed: any;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch (e) {
          // The API sometimes returns non-json; log it and continue
          console.log(`OpenAI JSON parse failed for ${tryModel}:`, raw.substring(0, 200));
          parsed = null;
        }

        // Check status
        if (!response.ok) {
          lastError = { status: response.status, ok: response.ok, raw, parsed, model: tryModel };
          
          // 429 (rate limit) or 5xx (server error) => retry with backoff
          if (response.status >= 500 || response.status === 429) {
            const wait = BASE_BACKOFF_MS * (2 ** attempt);
            console.log(`OpenAI ${tryModel} transient error ${response.status}, retrying in ${wait}ms`);
            await sleep(wait);
            continue;
          } else {
            // Client error (4xx) - don't retry with this model, try next model
            console.log(`OpenAI ${tryModel} client error ${response.status}, trying next model`);
            break;
          }
        }

        // Parse content
        const choice = parsed?.choices?.[0];
        const content = choice?.message?.content ?? null;

        if (!content || content.trim().length === 0) {
          // Empty content — treat as transient; try again next attempt or try fallback model
          lastError = { reason: 'empty_content', model: tryModel, raw, parsed };
          console.log(`OpenAI ${tryModel} returned empty content, attempt ${attempt + 1}`);
          
          // Small wait then retry
          await sleep(BASE_BACKOFF_MS * (1 + attempt));
          continue;
        }

        console.log(`OpenAI ${tryModel} success: content length=${content.length}`);

        // Optionally parse JSON inside content safely
        if (parseJson) {
          try {
            // Try to extract JSON from response if it's wrapped in markdown or has extra text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonContent = jsonMatch ? jsonMatch[0] : content;
            
            const json = JSON.parse(jsonContent);
            return { model: tryModel, rawResponse: parsed, parsedContent: json };
          } catch (e) {
            // If not valid JSON but you expect a number/score, try to extract with regex
            const maybeNumber = content.match(/-?\d+(\.\d+)?/);
            if (maybeNumber) {
              return { 
                model: tryModel, 
                rawResponse: parsed, 
                parsedContent: { score: Number(maybeNumber[0]), raw: content } 
              };
            }
            // else treat as failure for this model
            lastError = { reason: 'invalid_content_format', model: tryModel, raw, parsed, parseError: e.message };
            console.log(`OpenAI ${tryModel} JSON parse failed:`, e.message);
            await sleep(BASE_BACKOFF_MS * (1 + attempt));
            continue;
          }
        }

        // if parseJson === false, return raw content
        return { model: tryModel, rawResponse: parsed, parsedContent: content };
        
      } catch (err) {
        // Network or unexpected error - retry for transient codes
        lastError = { attempt, model: tryModel, error: err?.message ?? String(err) };
        console.log(`OpenAI ${tryModel} network error attempt ${attempt + 1}:`, err?.message);
        
        const wait = BASE_BACKOFF_MS * (2 ** attempt);
        await sleep(wait);
        continue;
      }
    } // end attempts
    // Model failed all attempts - continue to next model
    console.log(`OpenAI ${tryModel} failed all attempts, trying next model`);
  } // end models loop

  // All models & retries failed
  const error = new Error('All OpenAI attempts failed');
  (error as any).details = lastError;
  throw error;
}