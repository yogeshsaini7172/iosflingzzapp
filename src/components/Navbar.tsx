import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  Heart, 
  MessageCircle, 
  User, 
  Calendar,
  Zap,
  Menu,
  Bell,
  Settings
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/swipe', label: 'Swipe', icon: Zap },
    { to: '/pairing', label: 'Pairing', icon: Users },
    { to: '/matches', label: 'Matches', icon: Heart },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/blind-date', label: 'Blind Date', icon: Calendar },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ to, label, icon: Icon, mobile = false }: any) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white/10 ${
          isActiveRoute(to)
            ? 'bg-white/20 text-white font-semibold shadow-lg' 
            : 'text-white/80 hover:text-white'
        } ${mobile ? 'w-full justify-center' : ''}`
      }
      onClick={() => mobile && setIsOpen(false)}
    >
      <Icon className="h-4 w-4" />
      <span className={mobile ? 'hidden sm:inline' : ''}>{label}</span>
    </NavLink>
  );

  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <NavLink to="/" className="text-xl font-bold text-white hover:text-purple-300 transition-colors">
              DateSigma
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 relative"
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 border-0">
                3
              </Badge>
            </Button>

            {/* Profile Avatar */}
            <NavLink to="/profile">
              <Avatar className="h-8 w-8 border-2 border-purple-400/50 hover:border-purple-300 transition-colors cursor-pointer">
                <AvatarImage src="/api/placeholder/32/32" />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm">
                  AW
                </AvatarFallback>
              </Avatar>
            </NavLink>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 bg-black/95 backdrop-blur-lg border-l border-white/10">
                  <div className="flex flex-col space-y-4 mt-8">
                    {/* Profile section in mobile */}
                    <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                      <Avatar className="h-10 w-10 border-2 border-purple-400/50">
                        <AvatarImage src="/api/placeholder/40/40" />
                        <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          AW
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-semibold text-sm">Andrew Williams</p>
                        <p className="text-white/60 text-xs">University of Texas</p>
                      </div>
                    </div>

                    {/* Navigation items */}
                    <div className="space-y-2">
                      {navItems.map((item) => (
                        <NavItem key={item.to} {...item} mobile />
                      ))}
                    </div>

                    {/* Settings */}
                    <div className="pt-4 border-t border-white/10">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;