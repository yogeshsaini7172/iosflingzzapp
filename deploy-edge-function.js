#!/usr/bin/env node

/**
 * Simple script to help deploy the chat-management Edge Function
 * This ensures the get_messages action is available
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Deploying chat-management Edge Function...');

// Check if the function file exists
const functionPath = path.join(__dirname, 'supabase', 'functions', 'chat-management', 'index.ts');
if (!fs.existsSync(functionPath)) {
  console.error('❌ Edge Function file not found:', functionPath);
  process.exit(1);
}

// Read the function file to verify get_messages action exists
const functionContent = fs.readFileSync(functionPath, 'utf8');
if (!functionContent.includes('get_messages')) {
  console.error('❌ get_messages action not found in Edge Function');
  process.exit(1);
}

console.log('✅ get_messages action found in Edge Function');

try {
  // Try to deploy the function
  console.log('📤 Deploying to Supabase...');
  
  // First check if we're logged in
  try {
    execSync('npx supabase projects list', { stdio: 'pipe' });
    console.log('✅ Supabase CLI authenticated');
  } catch (authError) {
    console.log('⚠️ Supabase CLI not authenticated');
    console.log('Please run: npx supabase login');
    console.log('Or set SUPABASE_ACCESS_TOKEN environment variable');
    process.exit(1);
  }
  
  // Deploy the function
  const deployOutput = execSync('npx supabase functions deploy chat-management', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Edge Function deployed successfully!');
  console.log(deployOutput);
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n💡 Manual deployment steps:');
  console.log('1. Run: npx supabase login');
  console.log('2. Run: npx supabase functions deploy chat-management');
  console.log('3. Verify deployment in Supabase Dashboard > Edge Functions');
}