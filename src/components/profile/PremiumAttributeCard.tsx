import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface PremiumAttributeCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  description?: string;
}

const PremiumAttributeCard = ({ 
  title, 
  icon: Icon, 
  children,
  description 
}: PremiumAttributeCardProps) => {
  return (
    <Card className="premium-card border-0 hover-lift group overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-elegant group-hover:shadow-glow transition-all duration-300 group-hover:scale-110 transform-gpu">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-bold gradient-text">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-3">
        {children}
      </CardContent>
    </Card>
  );
};

interface PremiumBadgeGroupProps {
  items: string[];
  variant?: 'default' | 'secondary' | 'outline';
}

export const PremiumBadgeGroup = ({ items, variant = 'secondary' }: PremiumBadgeGroupProps) => {
  if (!items || items.length === 0) return null;

  const formatLabel = (value: string) => {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Badge
          key={index}
          variant={variant}
          className="px-4 py-2 text-sm font-medium hover-lift transition-all duration-300 hover:shadow-glow animate-fade-in backdrop-blur-sm"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {formatLabel(item)}
        </Badge>
      ))}
    </div>
  );
};

interface PremiumStatItemProps {
  label: string;
  value: string | number;
  unit?: string;
}

export const PremiumStatItem = ({ label, value, unit }: PremiumStatItemProps) => {
  return (
    <div className="glass-effect p-4 rounded-xl hover-glow transition-all duration-300 group">
      <p className="text-sm text-muted-foreground mb-2 group-hover:text-foreground transition-colors">
        {label}
      </p>
      <p className="text-2xl font-bold gradient-text">
        {value}{unit && <span className="text-base ml-1">{unit}</span>}
      </p>
    </div>
  );
};

export default PremiumAttributeCard;
