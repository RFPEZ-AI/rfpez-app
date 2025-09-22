// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import { isPlatform, getPlatforms } from '@ionic/react';

/**
 * Custom hook to detect if screen matches a media query
 * @param query - CSS media query string
 * @returns boolean indicating if query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use addEventListener if available (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

/**
 * Hook to detect mobile/narrow screens using CSS media query (legacy)
 * @returns boolean indicating if screen is mobile/narrow
 * @deprecated Use useIsMobile instead for better mobile detection in Ionic apps
 */
export const useIsMobileCSS = (): boolean => {
  return useMediaQuery('(max-width: 768px)');
};

/**
 * Ionic-based hook to detect mobile devices including DevTools simulation
 * Detects Android, iOS, or mobileweb (DevTools device simulation)
 * Falls back to viewport width detection for DevTools compatibility
 * @returns boolean indicating if running on mobile device or mobile simulation
 */
export const useIsMobile = (): boolean => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const platforms = getPlatforms();
      const ionicMobileDetection =
        platforms.includes('android') ||
        platforms.includes('ios') ||
        platforms.includes('mobileweb') ||
        isPlatform('android') ||
        isPlatform('ios') ||
        isPlatform('mobileweb');
      
      // Fallback: Check user agent for mobile indicators and viewport width
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUserAgent = /android|iphone|ipod|ipad|mobile|blackberry|iemobile|opera mini/i.test(userAgent);
      const isMobileViewport = window.innerWidth <= 768;
      
      // Consider mobile if Ionic detects it OR if user agent suggests mobile OR if viewport is narrow
      const result = ionicMobileDetection || isMobileUserAgent || isMobileViewport;
      
      setIsMobileDevice(result);
      
      // Debug logging
      console.log('🔍 Mobile detection:', {
        platforms,
        isPlatformAndroid: isPlatform('android'),
        isPlatformIOS: isPlatform('ios'),
        isPlatformMobileWeb: isPlatform('mobileweb'),
        ionicMobileDetection,
        isMobileUserAgent,
        isMobileViewport,
        windowWidth: window.innerWidth,
        userAgent: userAgent.substring(0, 100) + '...',
        finalResult: result
      });
    };

    checkMobile();
    
    // Recheck on window resize to catch DevTools viewport changes
    const handleResize = () => {
      setTimeout(checkMobile, 100); // Small delay to let Ionic recalculate
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobileDevice;
};
