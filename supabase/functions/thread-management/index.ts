import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ThreadRequest {
  action: 'create' | 'update' | 'delete' | 'like' | 'unlike' | 'reply';
  threadId?: string;
  content?: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, threadId, content, userId }: ThreadRequest = await req.json();
    
    console.log(`Thread management request: ${action} for user: ${userId}`);

    switch (action) {
      case 'create':
        if (!content || !userId) {
          return new Response(
            JSON.stringify({ error: 'Content and userId are required' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { data: newThread, error: createError } = await supabase
          .from('threads')
          .insert({
            user_id: userId,
            content: content.trim()
          })
          .select()
          .single();

        if (createError) throw createError;

        console.log('Thread created successfully:', newThread.id);
        return new Response(
          JSON.stringify({ success: true, data: newThread }),
          { headers: corsHeaders }
        );

      case 'update':
        if (!threadId || !content || !userId) {
          return new Response(
            JSON.stringify({ error: 'ThreadId, content and userId are required' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { data: updatedThread, error: updateError } = await supabase
          .from('threads')
          .update({ 
            content: content.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', threadId)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log('Thread updated successfully:', threadId);
        return new Response(
          JSON.stringify({ success: true, data: updatedThread }),
          { headers: corsHeaders }
        );

      case 'delete':
        if (!threadId || !userId) {
          return new Response(
            JSON.stringify({ error: 'ThreadId and userId are required' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { error: deleteError } = await supabase
          .from('threads')
          .delete()
          .eq('id', threadId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        console.log('Thread deleted successfully:', threadId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: corsHeaders }
        );

      case 'like':
        if (!threadId || !userId) {
          return new Response(
            JSON.stringify({ error: 'ThreadId and userId are required' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { error: likeError } = await supabase
          .from('thread_likes')
          .insert({
            thread_id: threadId,
            user_id: userId
          });

        if (likeError) throw likeError;

        console.log('Thread liked successfully:', threadId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: corsHeaders }
        );

      case 'unlike':
        if (!threadId || !userId) {
          return new Response(
            JSON.stringify({ error: 'ThreadId and userId are required' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { error: unlikeError } = await supabase
          .from('thread_likes')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', userId);

        if (unlikeError) throw unlikeError;

        console.log('Thread unliked successfully:', threadId);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: corsHeaders }
        );

      case 'reply':
        if (!threadId || !content || !userId) {
          return new Response(
            JSON.stringify({ error: 'ThreadId, content and userId are required' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { data: newReply, error: replyError } = await supabase
          .from('thread_replies')
          .insert({
            thread_id: threadId,
            user_id: userId,
            content: content.trim()
          })
          .select()
          .single();

        if (replyError) throw replyError;

        console.log('Reply created successfully:', newReply.id);
        return new Response(
          JSON.stringify({ success: true, data: newReply }),
          { headers: corsHeaders }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: corsHeaders }
        );
    }

  } catch (error: any) {
    console.error('Thread management error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});