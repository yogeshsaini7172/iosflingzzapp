import { Heart, Instagram, Twitter, Linkedin, Mail, MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const PremiumFooter = () => {
  const footerLinks = {
    product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Security', href: '/security' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press Kit', href: '/press' },
    ],
    resources: [
      { label: 'Help Center', href: '/help' },
      { label: 'Safety Tips', href: '/safety' },
      { label: 'Community', href: '/community' },
      { label: 'Partners', href: '/partners' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram', gradient: 'from-pink-500 to-purple-500' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter', gradient: 'from-sky-400 to-blue-500' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn', gradient: 'from-blue-600 to-blue-700' },
  ];

  return (
    <footer className="relative mt-32 border-t border-border/50 bg-gradient-to-b from-background to-background/95 overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 mesh-gradient opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-primary opacity-50" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary blur-xl opacity-50 group-hover:opacity-75 transition-elegant" />
                <div className="relative w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-elegant">
                  <Heart className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-display font-bold gradient-text">FLINGZZ</span>
                <p className="text-xs text-muted-foreground tracking-wider">Premium Dating</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-sm">
              Experience luxury dating powered by AI. Connect with verified university students in an exclusive environment.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                  aria-label={social.label}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${social.gradient} blur-md opacity-0 group-hover:opacity-50 rounded-xl transition-elegant`} />
                  <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-card/80 to-card/60 border border-border/50 flex items-center justify-center hover:border-primary/50 transition-elegant group-hover:scale-110 shadow-medium group-hover:shadow-glow">
                    <social.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-elegant" strokeWidth={2} />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-6 relative inline-block">
                {category}
                <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-primary rounded-full" />
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <NavLink
                      to={link.href}
                      className="text-muted-foreground hover:text-foreground transition-elegant text-sm font-medium inline-flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-gradient-primary group-hover:w-3 transition-all duration-300 rounded-full" />
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="relative glass-premium rounded-2xl p-8 md:p-10 mb-16 border border-primary/20 overflow-hidden group hover:shadow-premium transition-elegant">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-elegant" />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold gradient-text mb-3">Stay Updated</h3>
            <p className="text-muted-foreground mb-6">
              Get the latest features, tips, and exclusive offers delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 transition-elegant"
                />
              </div>
              <button className="px-8 h-12 bg-gradient-primary text-primary-foreground font-semibold rounded-xl shadow-elegant hover:shadow-glow hover:scale-105 transition-elegant whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} FLINGZZ. All rights reserved. Made with{' '}
              <Heart className="inline h-4 w-4 text-primary animate-pulse" /> for modern connections.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Serving 500+ Universities Worldwide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom elements */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-50" />
    </footer>
  );
};

export default PremiumFooter;
