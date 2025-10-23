# Deploy Supabase Edge Functions
# This script deploys the updated Edge Functions to Supabase

Write-Host "🚀 Deploying Supabase Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# List of critical functions that need to be deployed
$functions = @(
    "chat-request-handler",
    "chat-management",
    "deterministic-pairing",
    "create-subscription-order",
    "verify-subscription-payment"
)

Write-Host "📋 Functions to deploy:" -ForegroundColor Yellow
foreach ($func in $functions) {
    Write-Host "  • $func" -ForegroundColor Gray
}
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Deploy these functions? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔧 Starting deployment..." -ForegroundColor Green
Write-Host ""

# Deploy each function
$successCount = 0
$failCount = 0

foreach ($func in $functions) {
    Write-Host "📤 Deploying $func..." -ForegroundColor Cyan
    
    try {
        supabase functions deploy $func
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $func deployed successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ❌ $func deployment failed" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  ❌ Error deploying $func : $_" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 Deployment Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Successful: $successCount" -ForegroundColor Green
Write-Host "  ❌ Failed: $failCount" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 All functions deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Wait 10-15 seconds for deployment to complete" -ForegroundColor Gray
    Write-Host "  2. Refresh your browser" -ForegroundColor Gray
    Write-Host "  3. Try the chat functionality again" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some functions failed to deploy" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure you're logged in: supabase login" -ForegroundColor Gray
    Write-Host "  2. Check your project is linked: supabase link" -ForegroundColor Gray
    Write-Host "  3. Verify the function files exist in supabase/functions/" -ForegroundColor Gray
}

Write-Host ""

