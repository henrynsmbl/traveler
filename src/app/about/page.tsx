'use client'

import { TutorialChat } from '@/components/tutorial/TutorialChat'
import { ChevronRight, MessageSquare, Palette, CalendarCheck } from 'lucide-react'
import React, { Fragment, useEffect, useState } from 'react'
import Image from 'next/image'

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

// Function to check WebP support
const useWebPSupport = () => {
  const [supportsWebP, setSupportsWebP] = useState(false);
  
  useEffect(() => {
    const checkWebPSupport = async () => {
      const webpSupported = document.createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0;
      
      setSupportsWebP(webpSupported);
    };
    
    checkWebPSupport();
  }, []);
  
  return supportsWebP;
};

const files = ["citysketch1.webp", "citysketch2.webp", "citysketch3.webp", "citysketch4.webp", 
               "mountainsketch1.webp", "mountainsketch2.webp", "mountainsketch3.webp", "mountainsketch4.webp", 
               "beachsketch1.webp", "beachsketch2.webp", "beachsketch3.webp", "beachsketch4.webp"]

const useStaticBackground = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState('');
  
  useEffect(() => {
    // Select a random image, but do it only once when the component mounts
    const randomIndex = Math.floor(Math.random() * files.length);
    const staticBackground = `/backgrounds/${encodeURIComponent(files[randomIndex])}`;
    setImageSrc(staticBackground);
    setIsLoading(false);
  }, []);  // Empty dependency array ensures this runs only once

  return { imageSrc, isLoading };
};

// Separate the tutorial section into its own component
const TutorialSection = () => {
  return (
    <div className="mx-auto max-w-[68rem] pb-16 sm:pb-32 overflow-hidden">
      <div className="text-center mb-8 sm:mb-12 px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
          How It Works
        </h2>
        <div className="mt-4 mx-auto w-24 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
      </div>

      {/* Added feature explanation section */}
      <div className="max-w-3xl mx-auto mb-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-blue-100 dark:border-blue-900 bg-white/70 dark:bg-gray-800/70 shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02] group">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold mb-4 shadow-md group-hover:shadow-blue-200 dark:group-hover:shadow-blue-900/30 transition-all">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Prompt</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                Searches the web in real-time to summarize the most relevant travel information.
              </p>
            </div>
          </div>
          
          <div className="p-6 rounded-xl border border-blue-100 dark:border-blue-900 bg-white/70 dark:bg-gray-800/70 shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02] group">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold mb-4 shadow-md group-hover:shadow-blue-200 dark:group-hover:shadow-blue-900/30 transition-all">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Personalize</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                Craft your journey with our tools that adapt to your unique travel style.
              </p>
            </div>
          </div>
          
          <div className="p-6 rounded-xl border border-blue-100 dark:border-blue-900 bg-white/70 dark:bg-gray-800/70 shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02] group">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold mb-4 shadow-md group-hover:shadow-blue-200 dark:group-hover:shadow-blue-900/30 transition-all">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Book</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                Book entire trips with a single click. Our travel agents will handle the rest.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual separator and Examples heading */}
      <div className="text-center mb-10 mt-16">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-blue-50 dark:bg-gray-800 px-6 py-2 text-2xl font-semibold text-gray-800 dark:text-gray-200 rounded-full shadow-sm">
              Examples
            </span>
          </div>
        </div>
      </div>

      <TutorialChat />
    </div>
  );
};

export default function AboutPage() {
  const { imageSrc, isLoading } = useStaticBackground();

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section with Steps */}
      <div 
        className="relative min-h-screen w-full flex flex-col justify-center items-center flex-shrink-0 pt-20 md:pt-0"
      >
        {/* Background image with Next.js Image component */}
        {imageSrc && (
          <div className="absolute inset-0">
            <Image
              src={imageSrc}
              alt="Background"
              fill
              priority
              sizes="100vw"
              quality={80}
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEDQIHXG8H1QAAAABJRU5ErkJggg=="
            />
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center">
            <div className="animate-pulse text-white text-xl">Loading...</div>
          </div>
        )}
        
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

      {/* Add spacing div between sections - reduced height */}
      <div className="py-8 md:py-12 bg-gradient-to-b from-white to-blue-50/30 dark:from-gray-900 dark:to-gray-800/30"></div>

      {/* Tutorial Section - removed white background wrapper */}
      <TutorialSection />

      {/* Section break for Team - maximally reduced spacing */}
      <div className="text-center mb-4 -mt-12 sm:-mt-16 md:-mt-20">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-6 py-2 text-2xl font-semibold text-gray-800 dark:text-gray-200 rounded-full shadow-sm">
              Our Team
            </span>
          </div>
        </div>
      </div>

      {/* Redesigned Team Introduction Section - maximally reduced spacing */}
      <div className="relative pt-0 pb-12 overflow-hidden">
        {/* Remove decorative elements that might affect background appearance */}
        
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
          
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-xl border border-blue-100/80 dark:border-blue-900/30 overflow-hidden will-change-transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
            <div className="grid grid-cols-1 md:grid-cols-5">
              {/* Left column - colored background with stats */}
              <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-purple-700 text-white p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Global Expertise</h3>
                  <p className="text-white/90 mb-8 leading-relaxed">
                    Our team combines human expertise with AI-powered insights to create travel experiences curated to your needs.
                  </p>
                  <p className="text-white/90 mb-8 leading-relaxed">
                    Our travel agents have collectively been to all 7 continents and over 100 countries, we are more than excited to help you plan your next adventure.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="border-l-2 border-white/30 pl-4">
                    <div className="text-3xl font-bold">7</div>
                    <div className="text-sm text-white/80 mt-1">Continents Covered</div>
                  </div>
                  <div className="border-l-2 border-white/30 pl-4">
                    <div className="text-3xl font-bold">100+</div>
                    <div className="text-sm text-white/80 mt-1">Countries Visited</div>
                  </div>
                  <div className="border-l-2 border-white/30 pl-4">
                    <div className="text-3xl font-bold">1000+</div>
                    <div className="text-sm text-white/80 mt-1">Trips Planned</div>
                  </div>
                  <div className="border-l-2 border-white/30 pl-4">
                    <div className="text-3xl font-bold">∞</div>
                    <div className="text-sm text-white/80 mt-1">Possibilities</div>
                  </div>
                </div>
              </div>
              
              {/* Right column - content */}
              <div className="md:col-span-3 p-8 md:p-10">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI + Human Expertise</h3>
                  
                  <p className="leading-relaxed">
                    We're the first platform to seamlessly blend advanced AI technology with real human travel agents, allowing you to book entire trips with a single click.
                  </p>
                  
                  <div className="my-8 border-l-4 border-blue-500 pl-6 italic">
                    "Our unique approach combines the efficiency and intelligence of AI with the nuanced understanding and creativity of experienced travel professionals."
                  </div>
                  
                  <p className="font-medium text-blue-600 dark:text-blue-400 text-lg">
                    Simply describe your dream trip, and our AI will work with our travel experts to handle all the details—from flights and accommodations to activities and special requests.
                  </p>
                </div>
                
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    AI-Powered Research
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                    Human Curation
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                    One-Click Booking
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    Personalized Itineraries
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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