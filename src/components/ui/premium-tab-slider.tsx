import { useState, useRef, useEffect } from 'react';
import { MapPin, User, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface PremiumTabSliderProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function PremiumTabSlider({ tabs, activeTab, onTabChange, className = '' }: PremiumTabSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = dragStartX - clientX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < tabs.length - 1) {
        onTabChange(tabs[activeIndex + 1].id);
      } else if (diff < 0 && activeIndex > 0) {
        onTabChange(tabs[activeIndex - 1].id);
      }
      setIsDragging(false);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Premium Slider Container */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Animated Background Indicator */}
        <div className="relative flex items-center justify-center gap-3 p-2">
          {/* Background glow effect */}
          <motion.div
            className="absolute inset-0 glass-premium rounded-[2rem] overflow-hidden"
            initial={false}
            animate={{
              background: `linear-gradient(135deg, 
                hsl(var(--primary) / 0.1), 
                hsl(var(--primary-dark) / 0.15))`,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Sliding Indicator */}
          <motion.div
            className="absolute h-[calc(100%-1rem)] rounded-[1.75rem] bg-gradient-primary shadow-glow"
            initial={false}
            animate={{
              left: `${(activeIndex / tabs.length) * 100 + (1 / tabs.length) * 50}%`,
              width: `calc(${100 / tabs.length}% - 0.75rem)`,
              x: '-50%',
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          />

          {/* Tab Buttons */}
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative z-10 flex-1 flex flex-col items-center justify-center
                  py-3 px-4 rounded-[1.75rem] transition-all duration-300
                  ${isActive 
                    ? 'text-white' 
                    : 'text-foreground/60 hover:text-foreground/80'
                  }
                `}
              >
                {/* Icon with scale animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="mb-1"
                >
                  {tab.icon}
                </motion.div>
                
                {/* Label */}
                <motion.span
                  className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.span>

                {/* Active dot indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-white shadow-glow"
                    />
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      {/* Swipe Indicator Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {tabs.map((tab, index) => (
          <motion.div
            key={tab.id}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'bg-primary w-6' 
                : 'bg-foreground/20 w-1'
            }`}
            animate={{
              width: index === activeIndex ? 24 : 4,
              opacity: index === activeIndex ? 1 : 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Default export for common use case
export default function ProfileTabSlider({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void;
}) {
  const tabs: TabItem[] = [
    { id: 'location', label: 'Location', icon: <MapPin size={20} /> },
    { id: 'what-you-are', label: 'You Are', icon: <User size={20} /> },
    { id: 'who-you-want', label: 'You Want', icon: <Heart size={20} /> },
  ];

  return (
    <PremiumTabSlider 
      tabs={tabs} 
      activeTab={activeTab} 
      onTabChange={onTabChange}
      className="mb-6"
    />
  );
}
