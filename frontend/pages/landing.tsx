import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import AnimatedBackground from '../components/animated-background';
import { ThemeProvider } from '../components/theme-provider';
import { LanguageProvider } from '../components/language-context';
import { ArrowRight, BarChart, Heart, Zap } from 'lucide-react';

const LandingPage: React.FC = () => {
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="cattlecare-theme">
      <LanguageProvider>
        <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
          <AnimatedBackground />
          
          <div className="relative z-10 flex flex-col min-h-screen">
            {/* Header */}
            <header className="container mx-auto px-4 py-6 flex justify-between items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="text-2xl --font-space"
              >
                CattleCare Pro
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Link to="/app">
                  <Button variant="ghost">
                    Go to App <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex items-center">
              <div className="container mx-auto px-4 text-center">
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-5xl md:text-7xl font-extrabold mb-4 text-foreground"
                >
                  Revolutionizing Cattle Health
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground mb-8"
                >
                  AI-powered insights for proactive livestock management. Monitor health, detect lameness, and optimize nutrition with our advanced platform.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, type: 'spring', stiffness: 150 }}
                >
                  <Link to="/app">
                    <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/50">
                      Get Started Now <Zap className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </motion.div>

                {/* Features */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {[
                    { icon: <Heart className="h-8 w-8 text-red-400" />, title: "Health Analysis", description: "Real-time health monitoring and alerts." },
                    { icon: <BarChart className="h-8 w-8 text-green-400" />, title: "Lameness Detection", description: "Early detection of mobility issues using computer vision." },
                    { icon: <Zap className="h-8 w-8 text-yellow-400" />, title: "Nutrition Planning", description: "Optimized feeding schedules for better growth." }
                  ].map((feature, i) => (
                    <motion.div 
                      key={i}
                      custom={i}
                      variants={featureVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-6 bg-secondary/50 backdrop-blur-sm rounded-xl border border-border/50"
                    >
                      <div className="flex justify-center mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </main>

            {/* Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-12 py-6 text-center text-sm text-muted-foreground"
            >
              <p>&copy; {new Date().getFullYear()} CattleCare Pro. All rights reserved.</p>
            </motion.footer>
          </div>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default LandingPage;
