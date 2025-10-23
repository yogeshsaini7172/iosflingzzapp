# 🚀 Quick Reference - Payment & Subscription Setup

## 📂 Files Created for You

1. **`DATABASE_VERIFICATION_QUERIES.sql`** 
   - Run this FIRST to check your current database
   - Send me the results

2. **`DATABASE_SETUP_MANUAL.sql`**
   - Complete setup script for all tables
   - Run after verification

3. **`DATABASE_SETUP_GUIDE.md`**
   - Step-by-step instructions
   - Follow this guide

## ⚡ Quick Start (3 Steps)

### Step 1: Check Database
```sql
-- Open Supabase SQL Editor
-- Run DATABASE_VERIFICATION_QUERIES.sql
-- Copy all results and send to me
```

### Step 2: Setup Tables (after sending results)
```sql
-- Run DATABASE_SETUP_MANUAL.sql
-- Creates subscriptions table
-- Adds subscription columns to profiles
-- Sets up indexes and triggers
```

### Step 3: Test with Real Data
```sql
-- I'll provide exact commands with YOUR user ID
-- Creates test subscription
-- Updates profile
-- Verifies everything works
```

## 🔍 What You Need to Send Me

Run these 6 queries and send results:

1. **Check subscriptions table exists**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'subscriptions'
   );
   ```

2. **Check subscriptions columns**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'subscriptions';
   ```

3. **Check profiles subscription fields**
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'profiles'
     AND column_name LIKE '%subscription%';
   ```

4. **Get sample user ID**
   ```sql
   SELECT id, user_id, first_name, email
   FROM public.profiles
   WHERE user_id IS NOT NULL
   LIMIT 1;
   ```

5. **Count existing subscriptions**
   ```sql
   SELECT COUNT(*) FROM public.subscriptions;
   ```

6. **Any errors?**
   - Copy any error messages

## 🎯 What We're Building

### subscriptions Table
Stores all payment transactions:
- `id` - Unique subscription ID
- `user_id` - Firebase UID
- `plan` - basic_69, standard_129, premium_243
- `razorpay_order_id` - From Razorpay
- `razorpay_payment_id` - From Razorpay
- `is_active` - Payment completed?
- `amount` - Payment amount
- `payment_completed_at` - When paid

### profiles Table Updates
Adds subscription info to user profile:
- `subscription_plan` - Current plan
- `subscription_tier` - Same as plan
- `is_subscribed` - true/false
- `subscription_started_at` - When activated
- `subscription_expires_at` - When expires

### subscription_history Table
Tracks all subscription events:
- All payment records
- Upgrades/downgrades
- Cancellations
- For analytics

## 💡 Why This Works

1. **When user selects plan** → Frontend calls backend
2. **Backend creates Razorpay order** → Saves to subscriptions (is_active=false)
3. **User completes payment** → Razorpay returns payment details
4. **Backend verifies payment** → Updates subscriptions (is_active=true)
5. **Backend updates profile** → Sets subscription_plan, is_subscribed=true
6. **User gets upgraded** → App shows premium features

## 🔒 Security

- All payment verification on backend
- HMAC signature verification
- Firebase authentication required
- RLS policies on tables

## 📞 Contact Flow

**You → Run queries → Send results → Me**
↓
**Me → Analyze → Create custom SQL → You**
↓
**You → Run setup SQL → Send confirmation → Me**
↓
**Me → Provide test data → You test → Done! ✅**

---

## 🚨 IMPORTANT

**Before running any SQL:**
1. ✅ Backup your database (Supabase has automatic backups)
2. ✅ Read each query to understand what it does
3. ✅ Test queries have comments - remove /* */ to use them
4. ✅ Replace 'YOUR_FIREBASE_UID' with real user ID

## 📝 Next Action

**→ Open `DATABASE_VERIFICATION_QUERIES.sql`**
**→ Run in Supabase SQL Editor**
**→ Send me ALL the results**

Then I'll give you the exact setup commands! 🎉
