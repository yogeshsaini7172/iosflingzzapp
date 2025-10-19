// Aadhaar validation service for Surepass KYC API
// Sends POST /aadhaar-validation and returns a typed result

export type AadhaarValidationData = {
  client_id: string;
  age_range: string;
  aadhaar_number: string;
  state: string;
  gender: string;
  last_digits: string;
  is_mobile: boolean;
  remarks: string; // success | invalid_aadhaar | deactivated_aadhaar | invalid_aadhaar_format | failed
  less_info: boolean;
};

export type AadhaarValidationResult = {
  success: boolean;
  status_code?: number;
  data?: AadhaarValidationData | null;
  error?: string | null;
  raw?: any;
};

const SUREPASS_URL = 'https://kyc-api.surepass.io/api/v1/aadhaar-validation/aadhaar-validation';

function getBearerToken(): string | null {
  // Try Vite import.meta.env first (client), then process.env (server)
  try {
    // @ts-ignore - allow accessing import.meta in environments that support it
    const viteToken = (import.meta as any)?.env?.VITE_SUREPASS_TOKEN;
    if (viteToken) return viteToken;
  } catch (e) {
    // import.meta not available or not supported in this runtime
  }

  if (typeof process !== 'undefined' && process.env && process.env.SUREPASS_TOKEN) {
    return process.env.SUREPASS_TOKEN as string;
  }

  return null;
}

export async function validateAadhaar(id_number: string): Promise<AadhaarValidationResult> {
  if (!id_number) return { success: false, error: 'Missing id_number' };

  // If running in browser, proxy through our server to keep the token secret
  const isBrowser = typeof window !== 'undefined' && typeof window.fetch === 'function';
  if (isBrowser) {
    try {
      const res = await fetch('/api/validate-aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const err = json?.error || json?.message || `${res.status} ${res.statusText}`;
        return { success: false, status_code: res.status, error: err, raw: json };
      }

      return { success: true, status_code: res.status, data: json?.data ?? json?.data ?? null, raw: json };
    } catch (error: any) {
      return { success: false, error: error?.message ?? String(error) };
    }
  }

  // Server-side: call Surepass directly using token
  const token = getBearerToken();
  if (!token) return { success: false, error: 'Missing Surepass Bearer token. Set VITE_SUREPASS_TOKEN or SUREPASS_TOKEN.' };

  try {
    const SUREPASS_ENV = (typeof process !== 'undefined' && process.env && process.env.SUREPASS_ENV) ? process.env.SUREPASS_ENV : 'production';
    const SP_URL_BASE = SUREPASS_ENV === 'sandbox' ? 'https://sandbox.surepass.io' : 'https://kyc-api.surepass.io';
    const finalUrl = `${SP_URL_BASE}/api/v1/aadhaar-validation/aadhaar-validation`;

    const res = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ id_number }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const err = json?.message || json?.message_code || `${res.status} ${res.statusText}`;
      return { success: false, status_code: res.status, error: err, raw: json };
    }

    return { success: true, status_code: res.status, data: json?.data ?? null, raw: json };
  } catch (error: any) {
    return { success: false, error: error?.message ?? String(error) };
  }
}
