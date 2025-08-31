import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Calendar, Users, Heart, MessageCircle } from "lucide-react";

interface Student {
  id: string;
  name: string;
  age: number;
  avatar: string;
  university: string;
  major: string;
  year: number;
  distance: string;
  interests: string[];
}

interface Event {
  id: string;
  title: string;
  type: 'speed-dating' | 'group-chat' | 'virtual-event';
  date: string;
  participants: number;
  maxParticipants: number;
  description: string;
  interests: string[];
}

interface ExploreScreenProps {
  onNavigate: (view: 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches') => void;
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Sarah',
    age: 20,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616c57c8458?w=100&h=100&fit=crop&crop=face',
    university: 'NYU',
    major: 'Psychology',
    year: 2,
    distance: '0.5 miles',
    interests: ['Psychology', 'Dancing', 'Books']
  },
  {
    id: '2',
    name: 'Mike',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    university: 'NYU',
    major: 'Engineering',
    year: 4,
    distance: '1.2 miles',
    interests: ['Technology', 'Sports', 'Gaming']
  }
];

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Virtual Speed Dating Night',
    type: 'speed-dating',
    date: 'Tonight 8:00 PM',
    participants: 12,
    maxParticipants: 20,
    description: 'Meet 5 new people in 5-minute video chats. Fun, fast, and safe!',
    interests: ['Dating', 'Social']
  },
  {
    id: '2',
    title: 'Movie Lovers Chat',
    type: 'group-chat',
    date: 'Ongoing',
    participants: 28,
    maxParticipants: 50,
    description: 'Discuss the latest releases, hidden gems, and all things cinema.',
    interests: ['Movies', 'Entertainment']
  },
  {
    id: '3',
    title: 'Study Buddy Mixer',
    type: 'virtual-event',
    date: 'Sunday 2:00 PM',
    participants: 8,
    maxParticipants: 15,
    description: 'Find study partners and make connections while preparing for finals.',
    interests: ['Study', 'Academic']
  }
];

const ExploreScreen = ({ onNavigate }: ExploreScreenProps) => {
  const [activeTab, setActiveTab] = useState("discover");

  const renderEventIcon = (type: string) => {
    switch (type) {
      case 'speed-dating':
        return <Heart className="w-5 h-5 text-secondary" />;
      case 'group-chat':
        return <MessageCircle className="w-5 h-5 text-accent" />;
      case 'virtual-event':
        return <Users className="w-5 h-5 text-primary" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onNavigate('home')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Explore</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Students from Your College</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockStudents.map((student) => (
                  <Card key={student.id} className="shadow-soft border-0 hover:shadow-medium transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">
                            {student.name}, {student.age}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {student.major} • Year {student.year}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4" />
                            {student.distance} away
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {student.interests.slice(0, 3).map((interest) => (
                              <Badge key={interest} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="flex-1 bg-gradient-primary">
                          Connect
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Students from Nearby Colleges</h2>
              <Card className="p-6 text-center shadow-soft border-0">
                <div className="text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <h3 className="font-semibold mb-2">Expand Your Network</h3>
                  <p className="text-sm mb-4">
                    Connect with students from nearby universities and expand your social circle.
                  </p>
                  <Button className="bg-gradient-primary">
                    Enable Location
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-2">Campus Events & Activities</h2>
              <p className="text-sm text-muted-foreground">
                Join virtual events, speed dating nights, and interest-based groups
              </p>
            </div>

            {mockEvents.map((event) => (
              <Card key={event.id} className="shadow-soft border-0 hover:shadow-medium transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {renderEventIcon(event.type)}
                      <div>
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        event.participants >= event.maxParticipants 
                          ? 'border-destructive text-destructive' 
                          : 'border-success text-success'
                      }`}
                    >
                      {event.participants}/{event.maxParticipants}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    className="w-full bg-gradient-primary" 
                    disabled={event.participants >= event.maxParticipants}
                  >
                    {event.participants >= event.maxParticipants ? 'Full' : 'Join Event'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExploreScreen;