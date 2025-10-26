# Database Setup & Testing Guide

## 📋 STEP-BY-STEP INSTRUCTIONS

### **STEP 1: Run Verification Queries**

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file `DATABASE_VERIFICATION_QUERIES.sql`
4. Run each query one by one
5. **Copy and send me ALL the results** (you can paste them here or in a message)

### **STEP 2: I will analyze your results and provide custom SQL**

Based on what tables exist and what's missing, I'll give you:
- Exact SQL to create missing tables
- Commands to add missing columns
- Test data insertion with your actual user ID

### **STEP 3: Setup Database Tables** (after you send me results)

Run the commands I provide in `DATABASE_SETUP_MANUAL.sql`

### **STEP 4: Test Payment Flow**

We'll create a test subscription manually to verify everything works:

```sql
-- This will be customized based on your actual user ID
INSERT INTO public.subscriptions (
  user_id,
  plan,
  is_active,
  razorpay_order_id,
  razorpay_payment_id,
  amount
) VALUES (
  'YOUR_ACTUAL_FIREBASE_UID',  -- From verification query #6
  'basic_69',
  true,
  'test_order_123',
  'test_pay_123',
  69.00
);

-- Update profile
UPDATE public.profiles
SET 
  subscription_plan = 'basic_69',
  subscription_tier = 'basic_69',
  is_subscribed = true,
  subscription_started_at = now()
WHERE user_id = 'YOUR_ACTUAL_FIREBASE_UID';
```

## 🔍 What to Send Me

Please run `DATABASE_VERIFICATION_QUERIES.sql` and send me:

1. **Query 1 Result:** Does subscriptions table exist? (true/false)
2. **Query 2 Result:** Subscriptions table structure (all columns)
3. **Query 3 Result:** Profile subscription columns
4. **Query 4 Result:** Does subscription_history exist? (true/false)
5. **Query 5 Result:** Current subscription count
6. **Query 6 Result:** Sample user IDs (just copy the first row)
7. **Any errors** you see

### Example of what to send:

```
Query 1: subscriptions_table_exists = true

Query 2: 
- id | uuid | not null | gen_random_uuid()
- user_id | text | not null |
- plan | text | not null |
... (etc)

Query 3:
- subscription_plan | text | yes | 'free'
- subscription_tier | text | yes | 'free'
... (etc)

Query 6:
profile_id: abc-123
firebase_uid: xyz-789
first_name: Test
email: test@example.com
```

## 🎯 What We're Checking

1. **Do the tables exist?** (subscriptions, subscription_history)
2. **Do they have all required columns?** (razorpay_payment_id, amount, etc.)
3. **Does profiles table have subscription fields?** (subscription_plan, is_subscribed, etc.)
4. **Do we have a real user to test with?** (from your database)

## 🚀 After Setup is Complete

Once tables are ready, we'll verify that:
1. ✅ Payment details are saved to `subscriptions` table
2. ✅ User profile is updated with subscription tier
3. ✅ Razorpay order_id and payment_id are stored
4. ✅ Payment history is tracked
5. ✅ User's plan is upgraded in the app

## 📞 Next Steps

**Please run the verification queries now and send me the results!**

I'll then provide you with:
- ✅ Exact SQL commands to fix any missing tables/columns
- ✅ Test subscription insertion with your actual user ID
- ✅ Verification queries to confirm everything works
- ✅ Any code fixes needed in the backend functions

---

**Files to Use:**
- `DATABASE_VERIFICATION_QUERIES.sql` ← Run this first!
- `DATABASE_SETUP_MANUAL.sql` ← Run this after verification (I may customize it)
- This guide ← Follow the steps
