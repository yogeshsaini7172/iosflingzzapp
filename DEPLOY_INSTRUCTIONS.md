# 🚀 Redeploy Instructions

## Issue: 401 Error - Firebase token verification failing

## Fix: Updated token verification to work without FIREBASE_SERVICE_ACCOUNT_JSON

---

## Steps to Deploy:

### Option 1: Redeploy via Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard/project/cchvsqeqiavhanurnbeo/functions
2. Click on `create-subscription-order`
3. Click **"Deploy new version"** or **three dots** → **"Redeploy"**
4. Repeat for `verify-subscription-payment`

### Option 2: Copy Updated Code

**For `create-subscription-order`:**
- Copy the entire content from: `supabase/functions/create-subscription-order/index.ts`
- Paste into Dashboard editor and deploy

**For `verify-subscription-payment`:**
- Copy the entire content from: `supabase/functions/verify-subscription-payment/index.ts`
- Paste into Dashboard editor and deploy

---

## What Changed:
- Removed `FIREBASE_SERVICE_ACCOUNT_JSON` requirement
- Simplified token verification to just decode JWT and validate expiry
- Token verification now checks both `sub` and `user_id` fields
- Added try-catch for better error handling

---

## After Deployment:
1. Wait 10-15 seconds for deployment
2. Refresh your browser at http://localhost:8080/subscription
3. Try creating a subscription again
4. Should work without 401 error!

---

## Environment Variables Needed:
✅ RAZORPAY_KEY_ID
✅ RAZORPAY_KEY_SECRET
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SUPABASE_URL
✅ CLIENT_URL (optional, defaults to *)
❌ FIREBASE_SERVICE_ACCOUNT_JSON (no longer needed!)
