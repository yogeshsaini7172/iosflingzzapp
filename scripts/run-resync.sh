#!/bin/bash

# QCS Data Repair & Resync Script
echo "🚀 Starting QCS Data Repair & Resync"
echo "===================================="

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    echo ""
    echo "Usage:"
    echo "export SUPABASE_URL='https://your-project.supabase.co'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    echo "chmod +x scripts/run-resync.sh"
    echo "./scripts/run-resync.sh"
    exit 1
fi

# Run the resync script
echo "📊 Running QCS resync with Deno..."
deno run --allow-net --allow-env scripts/resync-qcs.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Resync completed successfully!"
    echo ""
    echo "🔍 Next steps:"
    echo "1. Test QCS calculation: POST to /functions/v1/qcs-scoring with user_id"
    echo "2. Check health: GET /functions/v1/health-ai"
    echo "3. Debug OpenAI if needed: deno run --allow-net --allow-env scripts/debug-openai.ts"
    echo "4. Monitor logs in Supabase dashboard"
else
    echo ""
    echo "❌ Resync failed. Check the error messages above."
    exit 1
fi