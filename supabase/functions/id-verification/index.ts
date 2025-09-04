import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Robust, chunk-safe base64 encoder for Uint8Array
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000; // 32k
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkStr = '';
    for (let j = 0; j < chunk.length; j++) chunkStr += String.fromCharCode(chunk[j]);
    binary += chunkStr;
  }
  return btoa(binary);
}

// OCR function to extract ID details using OpenAI Vision
async function extractIdDetails(imageBytes: Uint8Array) {
  try {
    const b64Img = toBase64(imageBytes);

    const payload = {
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an OCR engine. Always return valid JSON only.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the following fields from this ID card: 1. name (full name on ID), 2. dob (date of birth in YYYY-MM-DD), 3. expiry (expiry date if available, else null). Return ONLY JSON, nothing else.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64Img}` } },
          ],
        },
      ],
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', response.status, errText);
      return { name: null, dob: null, expiry: null };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      console.warn('OpenAI unexpected response structure:', JSON.stringify(data).slice(0, 500));
      return { name: null, dob: null, expiry: null };
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse OpenAI JSON content:', content);
      return { name: null, dob: null, expiry: null };
    }
  } catch (error) {
    console.error('OCR Error:', error);
    return { name: null, dob: null, expiry: null };
  }
}

// Normalize strings for comparison
function normalize(val: string | null): string {
  return val ? val.toLowerCase().trim() : '';
}

// Fuzzy match for names using Levenshtein similarity (percentage)
function namesMatch(name1: string | null, name2: string | null, threshold = 80): boolean {
  if (!name1 || !name2) return false;

  const n1 = normalize(name1);
  const n2 = normalize(name2);

  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return true;

  // Levenshtein distance
  const rows = n1.length + 1;
  const cols = n2.length + 1;
  const dp: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = n1[i - 1] === n2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = dp[rows - 1][cols - 1];
  const similarity = (1 - distance / maxLen) * 100; // percentage
  return similarity >= threshold;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const govtId = formData.get('govt_id') as File;
    const secondaryId = formData.get('secondary_id') as File | null;
    const signupName = formData.get('signup_name') as string | null;
    const signupDob = formData.get('signup_dob') as string | null;
    const userId = formData.get('user_id') as string;

    if (!govtId) {
      throw new Error('Government ID is required');
    }

    // Extract details from government ID
    const govtBytes = new Uint8Array(await govtId.arrayBuffer());
    const govtDetails = await extractIdDetails(govtBytes);

    console.log('Government ID details:', govtDetails);

    let result;

    // Case A: Government ID + Secondary ID
    if (secondaryId) {
      const secBytes = new Uint8Array(await secondaryId.arrayBuffer());
      const secDetails = await extractIdDetails(secBytes);
      
      const matchName = namesMatch(govtDetails.name, secDetails.name);
      
      let matchDob = false;
      if (govtDetails.dob && secDetails.dob) {
        matchDob = normalize(govtDetails.dob) === normalize(secDetails.dob);
      }

      const status = matchName ? 'verified' : 'failed';

      result = {
        mode: 'govt+secondary',
        status,
        govt_id: govtDetails,
        secondary_id: secDetails,
        reason: status === 'verified' ? 'Name matched' : 'Name mismatch',
        dob_match: matchDob,
      };
    }
    // Case B: Government ID + Signup Info
    else if (signupName && signupDob) {
      const matchName = namesMatch(govtDetails.name, signupName);
      const matchDob = normalize(govtDetails.dob) === normalize(signupDob);

      const status = (matchName && matchDob) ? 'verified' : 'failed';

      result = {
        mode: 'govt+signup',
        status,
        govt_id: govtDetails,
        signup_info: { name: signupName, dob: signupDob },
        reason: status === 'verified' ? 'Both name & dob matched' : 'Mismatch',
      };
    }
    // Case C: Missing comparison data
    else {
      result = {
        status: 'failed',
        reason: 'Need either secondary_id or signup_name+dob'
      };
    }

    // Update verification status in database if successful
    if (result.status === 'verified' && userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'verified' })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating verification status:', error);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in id-verification function:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});