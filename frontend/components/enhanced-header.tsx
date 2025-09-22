import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity } from 'lucide-react';
import LanguageSelector from './language-selector';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from './language-context';
import { GiCow } from "react-icons/gi";

const EnhancedHeader: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      <div className="flex justify-between items-center mb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="flex items-center gap-3">
            
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                <GiCow size={45} color='black'/>
              </div>
              <div className="absolute inset-0"></div>
            
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-4xl font-bold color-white"
              >
                CattleCare Pro
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="text-muted-foreground flex items-center gap-2"
              >
                <Activity className="h-4 w-4 text-green-400" />
                Smart Cattle Management System
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex items-center gap-4"
        >
          <LanguageSelector />
          <ThemeToggle />
        </motion.div>
      </div>

      {/* Animated decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
        className="h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-8 origin-left"
      ></motion.div>
    </motion.div>
  );
};

export default EnhancedHeader;