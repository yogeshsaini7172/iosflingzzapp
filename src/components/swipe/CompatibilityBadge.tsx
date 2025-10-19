import { motion } from 'framer-motion';
import { Heart, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CompatibilityBadgeProps {
  label: string;
  userValue?: string | string[];
  partnerValue?: string | string[];
  type?: 'personality' | 'lifestyle' | 'interest' | 'value';
}

export function CompatibilityBadge({ 
  label, 
  userValue, 
  partnerValue,
  type = 'personality' 
}: CompatibilityBadgeProps) {
  // Check if there's a match
  const hasMatch = checkMatch(userValue, partnerValue);
  const matchStatus = hasMatch === true ? 'match' : hasMatch === false ? 'no-match' : 'neutral';

  // Colors based on match status
  const getColors = () => {
    switch (matchStatus) {
      case 'match':
        return {
          bg: 'bg-green-500/10 border-green-500/30',
          text: 'text-green-600 dark:text-green-400',
          icon: <Heart className="w-3 h-3" fill="currentColor" />
        };
      case 'no-match':
        return {
          bg: 'bg-orange-500/10 border-orange-500/30',
          text: 'text-orange-600 dark:text-orange-400',
          icon: <Minus className="w-3 h-3" />
        };
      default:
        return {
          bg: 'bg-muted/50 border-border',
          text: 'text-muted-foreground',
          icon: <Sparkles className="w-3 h-3" />
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        relative inline-flex items-center gap-1.5 px-3 py-1.5
        rounded-full border ${colors.bg} ${colors.text}
        text-xs font-medium backdrop-blur-sm
        hover-scale transition-all duration-200
      `}
    >
      {/* Icon */}
      <span className="flex-shrink-0">
        {colors.icon}
      </span>
      
      {/* Label */}
      <span className="truncate max-w-[120px]">
        {label}
      </span>

      {/* Match indicator pulse */}
      {matchStatus === 'match' && (
        <motion.div
          className="absolute -inset-0.5 rounded-full bg-green-500/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
}

// Helper function to check if values match
function checkMatch(
  userValue?: string | string[], 
  partnerValue?: string | string[]
): boolean | null {
  if (!userValue || !partnerValue) return null;

  const normalizeValue = (val: string) => 
    val.toLowerCase().trim().replace(/[_\s-]+/g, '');

  const normalize = (val: string | string[]): string[] => {
    if (Array.isArray(val)) {
      return val.map(normalizeValue);
    }
    return [normalizeValue(val)];
  };

  const userNormalized = normalize(userValue);
  const partnerNormalized = normalize(partnerValue);

  // Check if any values overlap
  const hasOverlap = userNormalized.some(uv => 
    partnerNormalized.some(pv => pv === uv)
  );

  return hasOverlap;
}

// Grouped compatibility display
interface CompatibilityGroupProps {
  title: string;
  icon?: React.ReactNode;
  items: Array<{
    label: string;
    userValue?: string | string[];
    partnerValue?: string | string[];
    type?: 'personality' | 'lifestyle' | 'interest' | 'value';
  }>;
  className?: string;
}

export function CompatibilityGroup({ 
  title, 
  icon, 
  items,
  className = '' 
}: CompatibilityGroupProps) {
  if (items.length === 0) return null;

  // Calculate match percentage
  const matches = items.filter(item => 
    checkMatch(item.userValue, item.partnerValue) === true
  ).length;
  const matchPercentage = Math.round((matches / items.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`space-y-3 ${className}`}
    >
      {/* Title with match percentage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        
        {matchPercentage > 0 && (
          <Badge 
            variant={matchPercentage >= 60 ? 'default' : 'secondary'}
            className="text-xs px-2 py-0.5"
          >
            {matchPercentage}% match
          </Badge>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <CompatibilityBadge
            key={`${item.label}-${index}`}
            {...item}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default CompatibilityBadge;
