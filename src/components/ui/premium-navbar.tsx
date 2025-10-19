import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import {
  Home,
  Users,
  Heart,
  MessageCircle,
  User,
  Calendar,
  Zap,
  Menu,
  Settings,
  Sparkles
} from 'lucide-react';

const PremiumNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/swipe', label: 'Swipe', icon: Zap },
    { to: '/pairing', label: 'Pairing', icon: Users },
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
        `group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-elegant overflow-hidden ${
          isActiveRoute(to)
            ? 'text-primary-foreground font-semibold'
            : 'text-foreground/80 hover:text-foreground'
        } ${mobile ? 'w-full' : ''}`
      }
      onClick={() => mobile && setIsOpen(false)}
    >
      {/* Active background with gradient */}
      {isActiveRoute(to) && (
        <div className="absolute inset-0 bg-gradient-primary opacity-100 -z-10 transition-elegant" />
      )}
      
      {/* Hover background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 -z-10 transition-elegant" />
      
      {/* Icon with glow effect on active */}
      <div className="relative">
        {isActiveRoute(to) && (
          <div className="absolute inset-0 blur-lg bg-primary-glow/50 animate-pulse-glow" />
        )}
        <Icon className="h-5 w-5 relative z-10" strokeWidth={isActiveRoute(to) ? 2.5 : 2} />
      </div>
      
      <span className={mobile ? '' : 'hidden xl:inline'}>{label}</span>
      
      {/* Active indicator */}
      {isActiveRoute(to) && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-glow rounded-full blur-sm" />
      )}
    </NavLink>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/50 shadow-elegant">
      {/* Premium glow effect at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-primary opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with premium styling */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary blur-xl opacity-50 group-hover:opacity-75 transition-elegant" />
              <div className="relative w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-elegant group-hover:scale-110 transition-elegant">
                <Heart className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-bold gradient-text tracking-tight">
                FLINGZZ
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-wider">
                Premium Dating
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-4">
            {/* Notifications with premium styling */}
            <div className="relative">
              <NotificationCenter />
            </div>

            {/* Premium Profile Avatar */}
            <NavLink to="/profile" className="group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary blur-md opacity-0 group-hover:opacity-50 transition-elegant rounded-full" />
                <Avatar className="h-11 w-11 border-2 border-primary/30 group-hover:border-primary transition-elegant shadow-medium group-hover:scale-110 cursor-pointer relative">
                  <AvatarImage src="/api/placeholder/44/44" />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
                    AW
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-background shadow-sm" />
              </div>
            </NavLink>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-elegant" />
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-80 bg-gradient-to-br from-background/98 to-background/95 backdrop-blur-2xl border-l border-primary/20 shadow-premium"
                >
                  <div className="flex flex-col gap-6 mt-8">
                    {/* Profile section in mobile with premium styling */}
                    <div className="relative overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
                      <div className="relative flex items-center gap-4 p-5">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-primary blur-lg opacity-50" />
                          <Avatar className="h-16 w-16 border-3 border-primary/40 shadow-elegant relative">
                            <AvatarImage src="/api/placeholder/64/64" />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                              AW
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-3 border-background shadow-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-bold text-base truncate">Andrew Williams</p>
                          <p className="text-muted-foreground text-sm truncate">University of Texas</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-xs text-primary font-medium">Premium Member</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation items */}
                    <div className="space-y-2">
                      {navItems.map((item) => (
                        <NavItem key={item.to} {...item} mobile />
                      ))}
                    </div>

                    {/* Settings with premium styling */}
                    <div className="pt-4 border-t border-border/50">
                      <Button
                        variant="ghost"
                        className="w-full justify-start group hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent"
                      >
                        <Settings className="h-5 w-5 mr-3 group-hover:rotate-90 transition-elegant" />
                        <span className="font-medium">Settings</span>
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

export default PremiumNavbar;
