import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Calculate cutoff time (1 minute ago for testing)
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 1)

    // Delete threads older than 1 minute
    const { error, count } = await supabase
      .from('threads')
      .delete()
      .lt('created_at', cutoffTime.toISOString())
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw error
    }

    console.log(`Deleted ${count} threads older than 1 minute`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Expired threads cleaned up successfully',
        cutoffTime: cutoffTime.toISOString(),
        threadsDeleted: count || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error cleaning up threads:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to clean up threads',
        details: error instanceof Error ? error.toString() : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})