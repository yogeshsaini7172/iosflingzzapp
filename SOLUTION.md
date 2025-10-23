# Solution: Make Supabase Function Accept Anon Key in Authorization

## The Problem:
Supabase Edge Runtime validates JWT tokens BEFORE your function code runs.
Your function code is correct, but Supabase blocks the request at the infrastructure level.

## The Fix:

### Option 1: Use Supabase Anon Key as Authorization (RECOMMENDED)

Change your frontend to send the **anon key** in the Authorization header:

```typescript
// In fetchWithFirebaseAuth.ts or directly in SubscriptionPage
headers.set('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`);
```

### Option 2: Configure Function to be Public (Not Recommended)

In Supabase Dashboard:
1. Go to Edge Functions → create-subscription-order
2. Look for "Verify JWT" setting
3. Disable JWT verification (if available)

### Option 3: Send Both Keys (CURRENT APPROACH - needs fix)

The function expects:
- `apikey` header with anon key (for Supabase infrastructure)
- `Authorization` header with Firebase token (for your function logic)

But Supabase validates Authorization as a JWT first!

## Quick Test:

Try this curl command using anon key as Authorization:

```bash
curl -X POST https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/create-subscription-order \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U" \
  -H "Content-Type: application/json" \
  -d '{"plan": "basic", "amount": 49}'
```

If this works, we know the solution!

## Implementation:

Update your frontend to send Firebase token in a CUSTOM header instead of Authorization:

```typescript
headers.set('Authorization', `Bearer ${supabaseAnonKey}`); // For Supabase infrastructure
headers.set('X-Firebase-Token', firebaseToken); // For your function logic
```

Then update the function to read from X-Firebase-Token header instead of authorization header.
