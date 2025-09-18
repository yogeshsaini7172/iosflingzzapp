import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
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

    // Get Firebase token and verify user (except for 'list' action which can be public)
    let userId = null;
    const { action, threadId, content } = await req.json();

    if (action !== 'list') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({
          error: 'Authentication required'
        }), {
          status: 401,
          headers: corsHeaders
        });
      }

      // Verify Firebase token and get user ID  
      const verifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/firebase-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'apikey': Deno.env.get('SUPABASE_ANON_KEY')
        }
      });

      if (!verifyResponse.ok) {
        return new Response(JSON.stringify({
          error: 'Authentication failed'
        }), {
          status: 401,
          headers: corsHeaders
        });
      }

      const { userId: verifiedUserId } = await verifyResponse.json();
      if (!verifiedUserId) {
        return new Response(JSON.stringify({
          error: 'User not authenticated'
        }), {
          status: 401,
          headers: corsHeaders
        });
      }
      userId = verifiedUserId;
    }

    console.log(`Thread management request: ${action} for user: ${userId || 'anonymous'}`);

    switch (action) {
      case 'list': {
        // AUTOMATIC CLEANUP: Clean up expired threads when listing (happens frequently)
        // PRODUCTION: Deleting threads older than 24 HOURS
        const { error: cleanupError } = await supabase
          .from('threads')
          .delete()
          .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24 hours
        
        if (cleanupError) {
          console.warn('Cleanup warning (non-fatal):', cleanupError);
          // Don't fail thread listing if cleanup fails
        }
        
        // List all threads (no userId required for public viewing)
        const { data: threadsData, error: threadsError } = await supabase
          .from('threads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (threadsError) throw threadsError;

        // Fetch author profile info separately
        const userIds = Array.from(new Set((threadsData || []).map((t: any) => t.user_id).filter(Boolean)));
        
        // Fetch replies for all threads
        const threadIds = (threadsData || []).map((t: any) => t.id);
        let repliesByThreadId: any = {};

        if (threadIds.length > 0) {
          const { data: repliesData, error: repliesError } = await supabase
            .from('thread_replies')
            .select('*')
            .in('thread_id', threadIds)
            .order('created_at', { ascending: true });

          if (repliesError) throw repliesError;

          // Get user IDs from replies for profile lookup
          const replyUserIds = Array.from(new Set((repliesData || []).map((r: any) => r.user_id).filter(Boolean)));
          userIds.push(...replyUserIds);

          // Group replies by thread_id
          repliesByThreadId = (repliesData || []).reduce((acc: any, reply: any) => {
            if (!acc[reply.thread_id]) acc[reply.thread_id] = [];
            acc[reply.thread_id].push(reply);
            return acc;
          }, {});
        }

        let profilesByUserId: any = {};
        const uniqueUserIds = Array.from(new Set(userIds));

        if (uniqueUserIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, first_name, profile_images')
            .in('user_id', uniqueUserIds);

          if (profilesError) throw profilesError;

          profilesByUserId = (profiles || []).reduce((acc: any, p: any) => {
            acc[p.user_id] = {
              user_id: p.user_id,
              first_name: p.first_name,
              profile_images: p.profile_images
            };
            return acc;
          }, {});
        }

        const formatted = (threadsData || []).map((t: any) => {
          const expiresAt = new Date(t.created_at);
          expiresAt.setHours(expiresAt.getHours() + 24); // PRODUCTION: 24 hour expiry
          return {
            ...t,
            author: profilesByUserId[t.user_id] || null,
            replies: (repliesByThreadId[t.id] || []).map((reply: any) => ({
              ...reply,
              author: profilesByUserId[reply.user_id] || null
            })),
            expiresAt: expiresAt.toISOString()
          };
        });

        console.log(`Retrieved ${formatted.length} threads`);
        return new Response(JSON.stringify({
          success: true,
          data: formatted
        }), {
          headers: corsHeaders
        });
      }

      case 'create': {
        if (!content || !userId) {
          return new Response(JSON.stringify({
            error: 'Content is required and user must be authenticated'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
        
        // AUTOMATIC CLEANUP: Delete expired threads (older than 24 HOURS) before creating new ones
        // PRODUCTION: 24 hour expiry
        const { error: cleanupError } = await supabase
          .from('threads')
          .delete()
          .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24 hours
        
        if (cleanupError) {
          console.warn('Cleanup warning (non-fatal):', cleanupError);
          // Don't fail thread creation if cleanup fails
        } else {
          console.log('Automatic cleanup completed');
        }
        
        // Check if user already has a thread from today
        const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
        const { data: existingThreads, error: checkError } = await supabase
          .from('threads')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`);
          
        if (checkError) throw checkError;
        
        if (existingThreads && existingThreads.length > 0) {
          return new Response(JSON.stringify({
            error: 'You can only post one thread per day. Delete your current thread to post a new one.',
            code: 'ONE_THREAD_PER_DAY'
          }), {
            status: 409, // Conflict
            headers: corsHeaders
          });
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
        
        return new Response(JSON.stringify({
          success: true,
          data: newThread
        }), {
          headers: corsHeaders
        });
      }

      case 'update': {
        if (!threadId || !content || !userId) {
          return new Response(JSON.stringify({
            error: 'ThreadId and content are required and user must be authenticated'
          }), {
            status: 400,
            headers: corsHeaders
          });
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
        
        return new Response(JSON.stringify({
          success: true,
          data: updatedThread
        }), {
          headers: corsHeaders
        });
      }

      case 'delete': {
        if (!threadId || !userId) {
          return new Response(JSON.stringify({
            error: 'ThreadId is required and user must be authenticated'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const { error: deleteError } = await supabase
          .from('threads')
          .delete()
          .eq('id', threadId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
        console.log('Thread deleted successfully:', threadId);
        
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: corsHeaders
        });
      }

      case 'like': {
        if (!threadId || !userId) {
          return new Response(JSON.stringify({
            error: 'ThreadId is required and user must be authenticated'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const { error: likeError } = await supabase
          .from('thread_likes')
          .insert({
            thread_id: threadId,
            user_id: userId
          });

        if (likeError) throw likeError;
        console.log('Thread liked successfully:', threadId);
        
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: corsHeaders
        });
      }

      case 'unlike': {
        if (!threadId || !userId) {
          return new Response(JSON.stringify({
            error: 'ThreadId is required and user must be authenticated'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        const { error: unlikeError } = await supabase
          .from('thread_likes')
          .delete()
          .eq('thread_id', threadId)
          .eq('user_id', userId);

        if (unlikeError) throw unlikeError;
        console.log('Thread unliked successfully:', threadId);
        
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: corsHeaders
        });
      }

      case 'reply': {
        if (!threadId || !content || !userId) {
          return new Response(JSON.stringify({
            error: 'ThreadId and content are required and user must be authenticated'
          }), {
            status: 400,
            headers: corsHeaders
          });
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
        
        return new Response(JSON.stringify({
          success: true,
          data: newReply
        }), {
          headers: corsHeaders
        });
      }

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action'
        }), {
          status: 400,
          headers: corsHeaders
        });
    }
  } catch (error: any) {
    console.error('Thread management error:', error);
    return new Response(JSON.stringify({
      error: error?.message || 'An unexpected error occurred',
      details: error
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});