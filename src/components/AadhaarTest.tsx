import React, { useState } from 'react';
import { validateAadhaar } from '@/services/aadhaarValidation';

export default function AadhaarTest() {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Submit a standard HTML form POST so the browser will follow a server-side 302 redirect
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/validate-aadhaar-redirect';
      // add CSRF or x-api-secret header as hidden input if you use API_SECRET
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'id_number';
      input.value = id.trim();
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      return; // browser will navigate away
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Aadhaar Validation Test</h2>

      <label className="block mb-2">Aadhaar Number</label>
      <input
        className="w-full p-2 border rounded mb-3 bg-white/95 text-black placeholder:text-muted-foreground"
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="Enter Aadhaar number"
        inputMode="numeric"
        pattern="[0-9]*"
      />

      <div className="flex gap-2 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          onClick={run}
          disabled={loading || !id.trim()}
        >
          {loading ? 'Checking…' : 'Validate'}
        </button>
        <button
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => { setId(''); setResult(null); setError(null); }}
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="text-red-600 mb-4">Error: {error}</div>
      )}

      {result && (
        <div className="bg-gray-50 border rounded p-3 text-sm">
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">This calls the server proxy at <code>/api/validate-aadhaar</code> when running in the browser.</p>
    </div>
  );
}
