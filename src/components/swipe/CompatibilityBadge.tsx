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

  // Colors for matched items only
  const colors = {
    bg: 'bg-green-500/10 border-green-500/30',
    text: 'text-green-600 dark:text-green-400',
    icon: <Heart className="w-3 h-3" fill="currentColor" />
  };

  // Always return a consistent component structure to avoid hook violations
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: matchStatus === 'match' ? 1 : 0, scale: matchStatus === 'match' ? 1 : 0.9 }}
      transition={{ duration: 0.2 }}
      className={`
        relative inline-flex items-center gap-1.5 px-3 py-1.5
        rounded-full border ${colors.bg} ${colors.text}
        text-xs font-medium backdrop-blur-sm
        hover-scale transition-all duration-200
        ${matchStatus !== 'match' ? 'hidden' : ''}
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

      {/* Match indicator pulse - only show for matches */}
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
  // Filter to ONLY show matching items
  const matchingItems = items.filter(item => 
    checkMatch(item.userValue, item.partnerValue) === true
  );
  
  // Calculate match percentage based on matched items
  const matchPercentage = 100; // Always 100% since we only show matches

  // Always return a consistent component structure to avoid hook violations
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: matchingItems.length > 0 ? 1 : 0, y: matchingItems.length > 0 ? 0 : 10 }}
      transition={{ duration: 0.3 }}
      className={`space-y-3 ${className} ${matchingItems.length === 0 ? 'hidden' : ''}`}
    >
      {/* Title with match percentage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        
        <Badge 
          variant="default"
          className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 border-green-500/30"
        >
          {matchingItems.length} {matchingItems.length === 1 ? 'match' : 'matches'}
        </Badge>
      </div>

      {/* Badges - only matching items */}
      <div className="flex flex-wrap gap-2">
        {matchingItems.map((item, index) => (
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
