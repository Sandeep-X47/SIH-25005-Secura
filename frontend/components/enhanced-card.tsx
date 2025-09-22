import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LucideIcon } from 'lucide-react';

interface EnhancedCardProps {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  glowColor?: 'blue';
}

const glowStyles = {
  blue: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] border-blue-500/20 hover:border-blue-400/40',
  green: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] border-green-500/20 hover:border-green-400/40',
  purple: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] border-purple-500/20 hover:border-purple-400/40',
  red: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] border-red-500/20 hover:border-red-400/40',
  yellow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] border-yellow-500/20 hover:border-yellow-400/40',
};

const EnhancedCard: React.FC<EnhancedCardProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  className = '', 
  delay = 0,
  glowColor = 'blue'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card className={`
        relative overflow-hidden backdrop-blur-lg bg-card/80 border-2 
        transition-all duration-500 ease-out
        hover:bg-card/90
        ${glowStyles[glowColor]}
        ${className}
      `}>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 opacity-0 hover:opacity-5 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-green-500/20"></div>
        </div>

        {title && (
          <CardHeader className="relative z-10 pb-0">
            <CardTitle className="flex items-center gap-2 leading-normal">
              {Icon && (
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="relative"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="absolute inset-0 bg-primary/20 blur rounded-full"></div>
                </motion.div>
              )}
              <span className="bg-black from-foreground to-muted-foreground bg-clip-text">
                {title}
              </span>
            </CardTitle>
          </CardHeader>
        )}
        
        <CardContent className="relative z-10">
          {children}
        </CardContent>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full"></div>
      </Card>
    </motion.div>
  );
};

export default EnhancedCard;