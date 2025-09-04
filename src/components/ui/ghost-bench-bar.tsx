import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ghost, Users, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GhostBenchBarProps {
  onChatSelected: (chatId: string) => void;
}

const GhostBenchBar = ({ onChatSelected }: GhostBenchBarProps) => {
  const [ghostedUsers, setGhostedUsers] = useState<any[]>([]);
  const [benchedUsers, setBenchedUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ghost' | 'bench'>('ghost');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentUserId = () => {
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    const userId = getCurrentUserId();
    
    try {
      const { data: interactions, error } = await supabase
        .from("user_interactions")
        .select(`
          id,
          target_user_id,
          interaction_type,
          created_at,
          expires_at
        `)
        .eq("user_id", userId)
        .in("interaction_type", ["ghost", "bench"]);

      if (error) throw error;

      // Fetch profile details for each interaction
      const interactionsWithProfiles = await Promise.all(
        (interactions || []).map(async (interaction) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, profile_images")
            .eq("user_id", interaction.target_user_id)
            .single();

          return {
            ...interaction,
            profile
          };
        })
      );

      // Filter out expired ghosts
      const validInteractions = interactionsWithProfiles.filter(interaction => {
        if (interaction.interaction_type === 'ghost' && interaction.expires_at) {
          return new Date(interaction.expires_at) > new Date();
        }
        return true;
      });

      setGhostedUsers(validInteractions.filter(i => i.interaction_type === 'ghost'));
      setBenchedUsers(validInteractions.filter(i => i.interaction_type === 'bench'));
    } catch (error: any) {
      console.error("Error fetching interactions:", error);
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    setIsLoading(true);
    const userId = getCurrentUserId();

    try {
      // Check if chat room already exists
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .or(`and(user1_id.eq.${userId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${userId})`)
        .single();

      let chatRoomId = existingRoom?.id;

      if (!chatRoomId) {
        // Create new chat room
        const { data: newRoom, error: roomError } = await supabase
          .from("chat_rooms")
          .insert({
            user1_id: userId,
            user2_id: targetUserId
          })
          .select()
          .single();

        if (roomError) throw roomError;
        chatRoomId = newRoom.id;
      }

      onChatSelected(chatRoomId);
      toast({
        title: "Chat Opened",
        description: "You can now start chatting!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to open chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const activeUsers = activeTab === 'ghost' ? ghostedUsers : benchedUsers;

  return (
    <Card className="w-full bg-muted/30 border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant={activeTab === 'ghost' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('ghost')}
            className="flex items-center gap-2"
          >
            <Ghost className="w-4 h-4" />
            Ghosted ({ghostedUsers.length})
          </Button>
          <Button
            variant={activeTab === 'bench' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('bench')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Benched ({benchedUsers.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeUsers.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-4">
              No {activeTab === 'ghost' ? 'ghosted' : 'benched'} users
            </p>
          ) : (
            activeUsers.map((interaction) => (
              <Card key={interaction.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      {interaction.profile?.profile_images?.[0] ? (
                        <img 
                          src={interaction.profile.profile_images[0]} 
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {interaction.profile?.first_name?.[0]}
                          {interaction.profile?.last_name?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {interaction.profile?.first_name} {interaction.profile?.last_name}
                      </p>
                      {activeTab === 'ghost' && interaction.expires_at && (
                        <Badge variant="secondary" className="text-xs">
                          {getDaysRemaining(interaction.expires_at)} days left
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartChat(interaction.target_user_id)}
                    disabled={isLoading}
                    className="flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GhostBenchBar;