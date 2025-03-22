'use client'

import { TutorialChat } from '@/components/tutorial/TutorialChat'
import { ChevronRight, MessageSquare, Palette, CalendarCheck } from 'lucide-react'
import React, { Fragment, useEffect, useState } from 'react'

const steps = [
  {
    title: 'Prompt',
    icon: MessageSquare
  },
  {
    title: 'Personalize',
    icon: Palette
  },
  {
    title: 'Book',
    icon: CalendarCheck
  }
];

const files = ["citysketch1.png", "citysketch2.png", "citysketch3.png", "citysketch4.png", "mountainsketch1.png", "mountainsketch2.png", "mountainsketch3.png", "mountainsketch4.png", "beachsketch1.png", "beachsketch2.png", "beachsketch3.png", "beachsketch4.png"]

const useRotatingBackground = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the first image in the rotation as the default background
  const defaultBackground = `/backgrounds/${encodeURIComponent(files[0])}`;

  // Preload all images when component mounts
  useEffect(() => {
    const preloadImages = async () => {
      // First preload just the default image to ensure it's available immediately
      const defaultImg = new Image();
      defaultImg.src = defaultBackground;
      
      // Then preload the rest of the images
      const imagePromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = `/backgrounds/${encodeURIComponent(file)}`;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      });
      
      try {
        await Promise.all(imagePromises);
        setPreloadedImages(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to preload images:', error);
        // Still set to true so we don't block the UI if some images fail
        setPreloadedImages(true);
        setIsLoading(false);
      }
    };

    preloadImages();
  }, []);

  // Only start rotating after images are preloaded
  useEffect(() => {
    if (!preloadedImages) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % files.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [preloadedImages]);

  // Return default background while loading, then switch to rotating backgrounds
  return isLoading ? defaultBackground : `/backgrounds/${encodeURIComponent(files[currentIndex])}`;
};

// Separate the tutorial section into its own component
const TutorialSection = () => {
  return (
    <div className="mx-auto max-w-7xl pb-16 sm:pb-32 overflow-hidden">
      <div className="text-center mb-8 sm:mb-12 px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
          How It Works
        </h2>
        <div className="mt-4 mx-auto w-24 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
      </div>
      <TutorialChat />
    </div>
  );
};

export default function AboutPage() {
  const backgroundImage = useRotatingBackground();

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section with Steps */}
      <div 
        className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col justify-center items-center flex-shrink-0 pt-20 md:pt-0"
        style={{ 
          backgroundImage: `url("${backgroundImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 1s ease-in-out',
        }}
      >
        {/* Enhanced dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40 backdrop-blur-[2px]" />
        
        {/* Content */}
        <div className="relative w-full px-4 space-y-16 md:space-y-20">
          {/* Hero title with enhanced styling */}
          <div className="space-y-6 text-center">
            <h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-center relative"
              style={{ 
                color: 'white',
                textShadow: '0 4px 8px rgba(0,0,0,0.3), 0 0 4px rgba(59, 130, 246, 0.8)',
              }}
            >
              Travel, Your Way.
            </h1>
          </div>

          {/* Steps */}
          <div className="flex flex-col xl:flex-row justify-center items-center gap-12 xl:gap-16 max-w-7xl mx-auto px-4">
            {steps.map((step, index) => (
              <Fragment key={index}>
                <div className="group flex flex-col items-center space-y-4 transition-all duration-300 hover:scale-105">
                  <div className="p-3 text-white">
                    <step.icon className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-3xl md:text-3xl font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="text-white/40 hidden xl:block">
                    <ChevronRight className="w-8 h-8" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Tutorial Section - removed white background wrapper */}
      <TutorialSection />

      {/* Enhanced Contact Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-blue-100/50 dark:from-transparent dark:via-blue-950/30 dark:to-blue-900/50" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <div className="text-center flex flex-col items-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 inline-block text-transparent bg-clip-text mb-6">
              Let's Connect
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
              Have questions/suggestions? We're here to help make your travel dreams a reality.
            </p>
            <a 
              href="mailto:henry@aitinerary.world"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group mb-16"
            >
              <span>Get in Touch</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Footer links integrated */}
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <a href="/terms" className="hover:text-blue-500 transition-colors duration-200">
                  Terms & Conditions
                </a>
                <span className="text-gray-400">•</span>
                <a href="/privacy" className="hover:text-blue-500 transition-colors duration-200">
                  Privacy Policy
                </a>
              </div>
              <div className="flex items-center justify-center">
                <span className="font-medium">aitinerary, LLC</span>
                <span className="mx-2">•</span>
                <span>{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}