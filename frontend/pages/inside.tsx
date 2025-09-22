import React from 'react';
import { motion } from 'framer-motion'
import { TabsContent } from '../components/ui/tabs';
import '../i18n'
import { LanguageProvider } from '../components/language-context'
import { ThemeProvider } from '../components/theme-provider';
import AnimatedBackground from '../components/animated-background';
import EnhancedHeader from '../components/enhanced-header';
import EnhancedTabs from '../components/enhanced-tabs';
import EnhancedCard from '../components/enhanced-card';
import CowAnalysis from '../components/cow-analysis';
import WeatherWidget from '../components/weather-widget';
import VirtualDoctor from '../components/virtual-doctor';
import HospitalLocator from '../components/hospital-locator';
import NutritionTimetable from '../components/nutrition-timetable';
import LamenessAnalysis from '../components/lameness-analysis';

export default function Inside() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="cattlecare-theme">
      <LanguageProvider>
        <div className="min-h-screen relative overflow-hidden">
          <AnimatedBackground />
          
          <div className="relative z-10">
            <div className="container mx-auto px-4 py-6">
              {/* Enhanced Header */}
              <EnhancedHeader />

              {/* Main Content */}
              <EnhancedTabs defaultValue="analysis">
                <TabsContent value="analysis" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    <div className="lg:col-span-2">
                      <EnhancedCard glowColor="blue" delay={0.1}>
                        <CowAnalysis />
                      </EnhancedCard>
                    </div>
                    <div>
                      <EnhancedCard glowColor="blue" delay={0.3}>
                        <WeatherWidget />
                      </EnhancedCard>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="lameness" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto"
                  >
                    <EnhancedCard glowColor="blue">
                      <LamenessAnalysis />
                    </EnhancedCard>
                  </motion.div>
                </TabsContent>

                <TabsContent value="weather" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto"
                  >
                    <EnhancedCard glowColor="blue">
                      <WeatherWidget />
                    </EnhancedCard>
                  </motion.div>
                </TabsContent>

                <TabsContent value="doctor" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto"
                  >
                    <EnhancedCard glowColor="blue">
                      <VirtualDoctor />
                    </EnhancedCard>
                  </motion.div>
                </TabsContent>

                <TabsContent value="hospitals" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto"
                  >
                    <EnhancedCard glowColor="blue">
                      <HospitalLocator />
                    </EnhancedCard>
                  </motion.div>
                </TabsContent>

                <TabsContent value="nutrition" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-6xl mx-auto"
                  >
                    <EnhancedCard glowColor="blue">
                      <NutritionTimetable />
                    </EnhancedCard>
                  </motion.div>
                </TabsContent>
              </EnhancedTabs>

              {/* Enhanced Footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="mt-12 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground relative"
              >
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    CattleCare Pro - Advanced Cattle Management System
                  </p>
                  <p className="text-xs">
                    Built with modern technology for better livestock care
                  </p>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute inset-x-0 top-0 h-px"></div>
              </motion.footer>
            </div>
          </div>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}