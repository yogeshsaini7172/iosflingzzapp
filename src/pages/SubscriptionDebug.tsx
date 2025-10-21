import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const FUNCTIONS_BASE = (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string) || (import.meta.env.VITE_SUPABASE_URL as string) || '';

export default function SubscriptionDebug() {
  const { user } = useAuth();
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const runCreate = async () => {
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/create-subscription-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: user ? `Bearer ${await user.getIdToken()}` : '' },
        body: JSON.stringify({ amount: 49, currency: 'INR', plan: 'monthly', receipt: `debug_${Date.now()}` })
      });
      const json = await res.text();
      setOutput(`status:${res.status}\n${json}`);
    } catch (err) {
      setOutput(String(err));
    } finally { setLoading(false); }
  };

  const runVerify = async () => {
    const subscriptionId = prompt('Subscription ID to verify (existing row id):');
    const orderId = prompt('Razorpay order id:');
    const paymentId = prompt('Razorpay payment id:');
    const signature = prompt('Razorpay signature (hex):');
    if (!subscriptionId || !orderId || !paymentId || !signature) return;
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/verify-subscription-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature })
      });
      const json = await res.text();
      setOutput(`status:${res.status}\n${json}`);
    } catch (err) {
      setOutput(String(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Subscription Debug</h2>
      <div className="space-x-2">
        <button onClick={runCreate} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>Create Order</button>
        <button onClick={runVerify} className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>Verify Payment</button>
      </div>
      <pre className="mt-4 bg-gray-100 p-4 rounded">{output}</pre>
    </div>
  );
}
