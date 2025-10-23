#!/bin/bash

# Deploy Supabase Edge Functions
# This script deploys the updated Edge Functions to Supabase

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# List of critical functions that need to be deployed
functions=(
    "chat-request-handler"
    "chat-management"
    "deterministic-pairing"
    "create-subscription-order"
    "verify-subscription-payment"
)

echo "📋 Functions to deploy:"
for func in "${functions[@]}"; do
    echo "  • $func"
done
echo ""

# Ask for confirmation
read -p "Deploy these functions? (y/n): " confirmation
if [ "$confirmation" != "y" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔧 Starting deployment..."
echo ""

# Deploy each function
success_count=0
fail_count=0

for func in "${functions[@]}"; do
    echo "📤 Deploying $func..."
    
    if supabase functions deploy "$func"; then
        echo "  ✅ $func deployed successfully"
        ((success_count++))
    else
        echo "  ❌ $func deployment failed"
        ((fail_count++))
    fi
    
    echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary:"
echo "  ✅ Successful: $success_count"
echo "  ❌ Failed: $fail_count"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $fail_count -eq 0 ]; then
    echo "🎉 All functions deployed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Wait 10-15 seconds for deployment to complete"
    echo "  2. Refresh your browser"
    echo "  3. Try the chat functionality again"
else
    echo "⚠️  Some functions failed to deploy"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Make sure you're logged in: supabase login"
    echo "  2. Check your project is linked: supabase link"
    echo "  3. Verify the function files exist in supabase/functions/"
fi

echo ""

