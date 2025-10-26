// Ambient types to make VSCode/TS happy when editing Supabase Edge Functions locally.
// These do not affect runtime (Deno provides the actual implementations at deploy/runtime).

// Minimal Deno global typing used by our functions (env and std/http serve types).
declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
}

// Allow URL-based ESM imports without local type resolution errors.
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export interface ServeInit {
    port?: number;
    onListen?: (params: { port: number; hostname: string }) => void;
  }
  export type Handler = (request: Request) => Response | Promise<Response>;
  export function serve(handler: Handler, options?: ServeInit): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  export * from "@supabase/supabase-js";
}


