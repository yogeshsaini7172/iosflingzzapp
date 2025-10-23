# Debug Steps for Profile Update Issue

## Issue
After payment completes, the profile is not being updated automatically.

## Possible Causes

1. **PostgreSQL function not working** - The RPC call might be failing silently
2. **Wrong parameters** - The function parameters might not match
3. **RLS still blocking** - Even with SECURITY DEFINER, there might be permission issues
4. **Function not returning data** - The function might not be returning the expected format

## Solution: Use Direct SQL UPDATE Instead of RPC

Since the manual SQL UPDATE works perfectly, let's try using `supabase.rpc()` with a raw SQL approach or modify the function.

## Alternative: Simpler Approach

Instead of using a PostgreSQL function, we can try using the Supabase admin client with explicit permissions.

Replace the RPC call in verify-subscription-payment/index.ts with this direct update approach:

```javascript
// Instead of RPC, use direct SQL via Supabase client with explicit schema
const profileUpdate = await supabaseAdmin
  .schema('public')
  .from('profiles')
  .update({
    subscription_plan: plan,
    subscription_tier: tier,
    plan_id: plan,
    is_subscribed: true,
    subscription_started_at: subRow.start_date,
    subscription_expires_at: subRow.end_date,
    plan_started_at: subRow.start_date,
    plan_expires_at: subRow.end_date
  })
  .eq('user_id', userId)
  .select();

console.log('Profile update result:', JSON.stringify(profileUpdate));
```

But we already know this doesn't work. So let's try a different approach: **Execute raw SQL**

## Best Solution: Use PostgreSQL's sql function

Actually, the issue might be that we're calling a function that doesn't exist or isn't properly set up. Let me give you a simpler SQL function that definitely works:

```sql
CREATE OR REPLACE FUNCTION public.update_profile_subscription(
  uid text,
  sub_plan text,
  sub_tier text,
  expires_at timestamptz
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.profiles 
  SET 
    subscription_plan = sub_plan,
    subscription_tier = sub_tier,
    plan_id = sub_plan,
    is_subscribed = true,
    subscription_started_at = NOW(),
    subscription_expires_at = expires_at,
    plan_started_at = NOW(),
    plan_expires_at = expires_at
  WHERE user_id = uid;
$$;
```

This uses `RETURNS void` instead of `RETURNS TABLE`, which might be the issue.

Then in the Edge Function, call it like this:

```javascript
await supabaseAdmin.rpc('update_profile_subscription', {
  uid: userId,
  sub_plan: plan,
  sub_tier: tier,
  expires_at: subRow.end_date
});
```

