import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Sparkles, Users, Shield, GraduationCap, Trophy } from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-accent" />,
      title: 'Verified Students',
      description: 'Connect only with identity-verified college students'
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      title: 'Elite Universities',
      description: 'Meet students from top-tier academic institutions'
    },
    {
      icon: <Sparkles className="h-8 w-8 text-secondary" />,
      title: 'Smart Matching',
      description: 'AI-powered compatibility scoring and pairing system'
    },
    {
      icon: <Trophy className="h-8 w-8 text-accent" />,
      title: 'Quality Control',
      description: 'QCS (Quality Control Score) ensures premium matches'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-elegant relative overflow-hidden">
      {/* Background Effects - Static */}
      <div className="absolute inset-0">
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 lg:p-8">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-elegant font-bold text-white">GradSync</h1>
          </div>
          <Button 
            variant="outline" 
            className="glass-luxury border-white/30 text-white hover:bg-white/10"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-elegant font-bold leading-tight">
                Find Your
                <span className="text-gradient-primary block">Perfect Match</span>
                <span className="text-2xl lg:text-3xl font-normal opacity-90">
                  in College
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                The exclusive dating platform for verified college students. 
                Connect with ambitious peers from elite universities through our advanced compatibility system.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 shadow-royal text-lg px-8 py-4 h-auto transition-luxury"
                onClick={() => navigate('/login')}
              >
                <Heart className="mr-2 h-5 w-5" />
                Start Dating
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="glass-luxury border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 h-auto transition-luxury"
                onClick={() => navigate('/login')}
              >
                <Users className="mr-2 h-5 w-5" />
                View Profiles
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-accent">11</div>
                <div className="text-sm text-white/70">Active Profiles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary">100%</div>
                <div className="text-sm text-white/70">Verified Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-secondary">10+</div>
                <div className="text-sm text-white/70">Universities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-accent">AI</div>
                <div className="text-sm text-white/70">Powered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-6 lg:px-8 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-elegant font-bold text-white mb-4">
                Why Choose GradSync?
              </h2>
              <p className="text-white/80 text-lg max-w-2xl mx-auto">
                We're not just another dating app. We're a premium platform designed specifically for academic excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="glass-luxury border-white/20 hover-elegant">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="flex justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <div className="text-center mt-12">
              <div className="glass-luxury border-white/20 rounded-2xl p-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-elegant font-bold text-white mb-4">
                  Ready to Find Your Match?
                </h3>
                <p className="text-white/80 mb-6">
                  Join thousands of verified college students in finding meaningful connections.
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:opacity-90 shadow-royal text-lg px-8 py-4 h-auto transition-luxury"
                  onClick={() => navigate('/login')}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Started Now
                </Button>
                <p className="text-xs text-white/60 mt-4">
                  Free to join • Premium features available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;