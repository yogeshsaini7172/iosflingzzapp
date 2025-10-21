import express from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const PORT = process.env.MOCK_PORT || 54321;
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || 'dev_secret';

// In-memory "database"
const subscriptions = {};

function cors(req, res, next) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '600');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
}
app.use((req, res, next) => {
  const origin = req.headers.origin || 'http://localhost:8080';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(204).send();
  next();
});

app.post('/functions/v1/create-subscription-order', (req, res) => {
  try {
    const { amount, currency, plan, receipt } = req.body || {};
    if (!amount || !currency) return res.status(400).json({ error: 'Missing amount or currency' });
    const orderId = 'order_mock_' + uuidv4();
    const subscriptionId = uuidv4();
    subscriptions[subscriptionId] = {
      id: subscriptionId,
      user_id: 'mock-user',
      plan: plan || 'mock-plan',
      start_date: new Date().toISOString(),
      is_active: false,
      razorpay_order_id: orderId,
      amount: amount,
      currency,
      created_at: new Date().toISOString(),
    };
    console.log('Created mock order', { orderId, subscriptionId, amount, currency, plan });
    return res.json({ success: true, orderId, amount: Math.round(Number(amount) * 100), currency, subscriptionId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Mock profiles store
const profiles = {};

app.post('/functions/v1/verify-subscription-payment', (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, subscriptionId } = req.body || {};
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !subscriptionId) return res.status(400).json({ error: 'Missing fields' });
    const hmac = crypto.createHmac('sha256', RAZORPAY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated = hmac.digest('hex');
    console.log('Verify', { generated, provided: razorpay_signature });
    if (generated !== razorpay_signature) return res.status(400).json({ error: 'Invalid signature' });
    const sub = subscriptions[subscriptionId];
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    sub.is_active = true;
    sub.razorpay_payment_id = razorpay_payment_id;
    sub.payment_completed_at = new Date().toISOString();
    sub.updated_at = new Date().toISOString();
    console.log('Activated subscription', subscriptionId);
    
    // Update mock profile (mimic real function)
    const userId = sub.user_id;
    profiles[userId] = {
      id: userId,
      subscription_plan: sub.plan,
      is_subscribed: true,
      subscription_started_at: sub.payment_completed_at,
      subscription_expires_at: null,
      updated_at: new Date().toISOString()
    };
    console.log('Updated mock profile for user', userId);
    
    return res.json({ success: true, message: 'Payment verified and subscription activated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

app.get('/mock/subscriptions', (req, res) => {
  return res.json(Object.values(subscriptions));
});

app.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
  console.log('Use VITE_SUPABASE_FUNCTIONS_URL=http://localhost:' + PORT + '/functions/v1');
});
