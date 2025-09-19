// Debug script to test OpenAI API directly and inspect raw responses
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { sendOpenAIRequest } from '../lib/openai-client.ts';

async function debugOpenAI() {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    return;
  }

  console.log('🔍 OpenAI Debug Test');
  console.log('===================');
  console.log(`API Key present: ${!!openaiApiKey}`);
  console.log(`API Key length: ${openaiApiKey.length}`);
  console.log(`API Key prefix: ${openaiApiKey.substring(0, 7)}...`);
  console.log('');

  // Test cases
  const testCases = [
    {
      name: 'Simple JSON Request',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Return JSON only.' },
        { role: 'user', content: 'Return this JSON: {"test": "success", "number": 42}' }
      ]
    },
    {
      name: 'QCS Scoring Test',
      messages: [
        { role: 'system', content: 'You are a dating profile scorer. Return JSON only.' },
        { role: 'user', content: 'Score this profile (0-100): {"bio": "Love traveling", "interests": ["travel", "reading"]}. Return: {"score": number, "reason": "brief explanation"}' }
      ]
    },
    {
      name: 'Empty Response Test',
      messages: [
        { role: 'system', content: 'You must return valid JSON.' },
        { role: 'user', content: 'Return: {"empty_test": true}' }
      ]
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Test: ${testCase.name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await sendOpenAIRequest({
        apiKey: openaiApiKey,
        messages: testCase.messages,
        maxTokens: 300,
        parseJson: true
      });

      console.log('✅ SUCCESS');
      console.log(`Model used: ${result.model}`);
      console.log(`Parsed content:`, JSON.stringify(result.parsedContent, null, 2));
      
      // Check for empty content issues
      const choice = result.rawResponse?.choices?.[0];
      if (choice) {
        console.log(`Raw content length: ${choice.message?.content?.length || 0}`);
        console.log(`Finish reason: ${choice.finish_reason}`);
      }
      
    } catch (error) {
      console.log('❌ FAILED');
      console.log(`Error message: ${error.message}`);
      
      if (error.details) {
        console.log('Error details:', JSON.stringify(error.details, null, 2));
      }
    }
  }

  // Direct API test (bypass wrapper)
  console.log('\n🔧 Direct API Test');
  console.log('─'.repeat(50));
  
  try {
    const directResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return JSON only.' },
          { role: 'user', content: 'Return: {"direct_test": true, "value": 123}' }
        ],
        max_tokens: 100,
        temperature: 0
      }),
    });

    const directText = await directResponse.text();
    console.log(`Direct response status: ${directResponse.status}`);
    console.log(`Direct response length: ${directText.length}`);
    
    if (directResponse.ok) {
      try {
        const directJson = JSON.parse(directText);
        console.log('Direct parsed response:', JSON.stringify(directJson, null, 2));
        
        const content = directJson.choices?.[0]?.message?.content;
        console.log(`Direct content: "${content}"`);
        console.log(`Direct content length: ${content?.length || 0}`);
        console.log(`Direct content truthy: ${!!content}`);
        
      } catch (parseError) {
        console.log('❌ Direct response JSON parse failed:', parseError.message);
        console.log('Raw response text:', directText.substring(0, 500));
      }
    } else {
      console.log('❌ Direct API error:', directText);
    }
    
  } catch (directError) {
    console.log('❌ Direct API request failed:', directError.message);
  }

  console.log('\n🎯 Summary');
  console.log('─'.repeat(50));
  console.log('If you see "empty content" errors, check:');
  console.log('1. OpenAI API key validity and quotas');
  console.log('2. Model availability and permissions');
  console.log('3. Request format and parameters');
  console.log('4. Response parsing logic');
}

if (import.meta.main) {
  debugOpenAI().catch(error => {
    console.error('💥 Debug script failed:', error);
    Deno.exit(1);
  });
}