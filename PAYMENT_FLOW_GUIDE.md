# Payment Flow Implementation Guide

## ✅ What Has Been Implemented

### 1. **Subscription Step with Integrated Payment**

When users reach Step 7 (Subscription Selection) during profile setup:

1. **User sees 3 subscription plans:**
   - Basic (₹69/month)
   - Standard (₹129/month) - Most Popular
   - Premium (₹243/month)

2. **User clicks "Choose Plan" button:**
   - Razorpay script loads automatically
   - Backend creates a subscription order
   - Razorpay payment modal opens
   - User completes payment

3. **After successful payment:**
   - Payment is verified on backend
   - Subscription is activated in database
   - Profile is updated with subscription tier
   - Success message is shown
   - User can proceed to complete profile setup

4. **Payment data is automatically saved:**
   - `subscriptions` table: Order ID, Payment ID, Subscription details
   - `profiles` table: Subscription tier, activation date
   - `subscription_history` table: Payment record

### 2. **Payment Service Integration**

**File:** `src/services/subscriptionService.ts`

Key functions:
- `createSubscriptionOrder()` - Creates Razorpay order
- `verifySubscriptionPayment()` - Verifies payment signature
- `initiateSubscriptionPayment()` - Opens Razorpay checkout
- `getUserSubscription()` - Fetches subscription status

### 3. **Backend Edge Functions (Already Working)**

1. **create-subscription-order** (`supabase/functions/create-subscription-order/index.ts`)
   - Creates Razorpay order via API
   - Stores pending subscription in database
   - Returns order details

2. **verify-subscription-payment** (`supabase/functions/verify-subscription-payment/index.ts`)
   - Verifies Razorpay signature (HMAC-SHA256)
   - Activates subscription
   - Updates profile with subscription details
   - Records payment history

## 🔄 Complete Payment Flow

```
User on Step 7 (Subscription)
        ↓
Clicks "Choose Basic Plan"
        ↓
[Frontend] initiateSubscriptionPayment() called
        ↓
[Frontend] Loads Razorpay script (if not loaded)
        ↓
[Frontend] Calls createSubscriptionOrder()
        ↓
[Backend] create-subscription-order edge function
    - Creates Razorpay order
    - Stores in subscriptions table (is_active: false)
    - Returns: orderId, amount, subscriptionId
        ↓
[Frontend] Opens Razorpay checkout modal
        ↓
User enters payment details & completes payment
        ↓
[Razorpay] Calls handler callback with:
    - razorpay_payment_id
    - razorpay_order_id
    - razorpay_signature
        ↓
[Frontend] Calls verifySubscriptionPayment()
        ↓
[Backend] verify-subscription-payment edge function
    - Verifies signature (HMAC)
    - Updates subscription (is_active: true)
    - Updates profiles table:
        * subscription_plan
        * subscription_tier
        * is_subscribed: true
        * subscription_started_at
    - Inserts into subscription_history
        ↓
[Frontend] Payment successful!
    - Shows success toast
    - Enables "Next" button
    - User can complete profile setup
        ↓
Profile setup completes
        ↓
User enters app with active subscription
```

## 💾 Database Schema

### subscriptions Table
```sql
{
  id: UUID (primary key)
  user_id: TEXT (Firebase UID)
  plan: TEXT ('basic_69', 'standard_129', 'premium_243')
  start_date: TIMESTAMP
  end_date: TIMESTAMP (nullable)
  is_active: BOOLEAN
  razorpay_order_id: TEXT
  razorpay_payment_id: TEXT (nullable, filled after payment)
  payment_completed_at: TIMESTAMP (nullable)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### profiles Table (subscription fields)
```sql
{
  subscription_plan: TEXT
  subscription_tier: TEXT
  is_subscribed: BOOLEAN
  subscription_started_at: TIMESTAMP
  subscription_expires_at: TIMESTAMP (nullable)
}
```

### subscription_history Table
```sql
{
  id: UUID
  subscription_id: UUID (foreign key)
  user_id: TEXT
  plan: TEXT
  amount: NUMERIC (nullable)
  razorpay_order_id: TEXT
  razorpay_payment_id: TEXT
  activated_at: TIMESTAMP
}
```

## 🔑 Environment Setup

### Frontend (.env)
```bash
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx   # Your Razorpay Test Key ID
# Or for production:
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

### Backend (Supabase Edge Function Secrets)
```bash
# Set via Supabase CLI or Dashboard
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your_secret_key
```

## 🧪 Testing the Payment Flow

### Test Mode (with Razorpay Test Keys)

1. **Setup test keys:**
   - Login to Razorpay Dashboard
   - Get Test API Key ID and Secret
   - Add to environment variables

2. **Test card details:**
   ```
   Card Number: 4111 1111 1111 1111
   Expiry: Any future date
   CVV: Any 3 digits
   ```

3. **Test flow:**
   - Create new account
   - Complete profile steps 1-6
   - On Step 7, select a plan
   - Use test card
   - Payment should succeed
   - Check database for subscription record

### Production Mode

1. **Get production keys from Razorpay**
2. **Update environment variables**
3. **Complete KYC on Razorpay**
4. **Set up webhook for payment notifications** (optional)

## 🎨 UI Components

### SubscriptionStep.tsx
- Shows 3 plan cards with features
- "Choose Plan" button triggers payment
- Loading state during payment
- Success/failure feedback
- Payment status indicator

### Visual States:
1. **Initial State:** All plans shown, no selection
2. **Processing:** Spinner on selected plan, Razorpay modal open
3. **Success:** Green checkmark, "Payment Successful" message
4. **Failure:** Red error message, can try again

## 📱 User Experience

### What Users See:

1. **Step 7 appears with beautiful plan cards**
2. **User clicks "Choose Basic Plan"**
3. **Loading indicator: "Opening Payment Gateway..."**
4. **Razorpay modal opens with:**
   - Order details
   - Amount in INR
   - Card/UPI/Netbanking options
5. **User completes payment**
6. **Success message: "Payment Successful! 🎉"**
7. **Green confirmation box appears**
8. **"Next" button becomes enabled**
9. **Profile setup completes with subscription active**

## 🔒 Security Features

1. **Payment signature verification** (HMAC-SHA256)
2. **Firebase authentication** for all API calls
3. **Server-side validation** of payment amounts
4. **Secure Razorpay checkout** (PCI compliant)
5. **Environment-based key management**

## 🐛 Error Handling

### Common Errors & Solutions:

1. **"Payment gateway not configured"**
   - Solution: Add VITE_RAZORPAY_KEY_ID to .env

2. **"Failed to create subscription order"**
   - Check backend Razorpay keys are set
   - Verify Firebase auth is working

3. **"Payment verification failed"**
   - Check signature verification in backend
   - Ensure Razorpay secret key is correct

4. **"Payment cancelled by user"**
   - User closed modal - they can try again

## 📊 Analytics & Tracking

You can track:
- Plan selection rates
- Payment success rates
- Payment failure reasons
- Most popular plan
- Revenue by plan

Add tracking in:
- `handleSelectPlan()` - Track plan selection
- Payment success callback - Track successful payments
- Payment failure callback - Track failed payments

## 🔄 Subscription Management (Future)

To add later:
1. **View current subscription** on profile page
2. **Upgrade/downgrade** plans
3. **Cancel subscription** 
4. **Payment history** page
5. **Auto-renewal** handling
6. **Promo codes/coupons**

## 📝 Summary

✅ Payment fully integrated into onboarding flow
✅ Razorpay checkout opens on "Choose Plan" click
✅ Payment verification on backend
✅ Automatic database updates
✅ User-friendly UI with loading/success states
✅ Secure payment processing
✅ Error handling implemented

**The payment flow is production-ready once you add your Razorpay keys!** 🚀
