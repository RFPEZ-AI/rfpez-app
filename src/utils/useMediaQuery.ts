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
 * Uses hysteresis to prevent rapid layout switching during resize
 * @returns boolean indicating if running on mobile device or mobile simulation
 */
export const useIsMobile = (): boolean => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Hysteresis thresholds to prevent layout flickering
    // Switch to mobile when going below 768px
    // Switch to desktop when going above 900px
    // This creates a "sticky" zone between 768-900px that maintains current layout
    const MOBILE_THRESHOLD = 768;
    const DESKTOP_THRESHOLD = 900;
    
    const checkMobile = () => {
      const platforms = getPlatforms();
      const ionicMobileDetection =
        platforms.includes('android') ||
        platforms.includes('ios') ||
        platforms.includes('mobileweb') ||
        isPlatform('android') ||
        isPlatform('ios') ||
        isPlatform('mobileweb');
      
      // Fallback: Check user agent for mobile indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUserAgent = /android|iphone|ipod|ipad|mobile|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Get viewport width for final determination
      const width = window.innerWidth;
      
      // If Ionic/UA detects mobile BUT viewport is wide (e.g., tablet landscape, DevTools),
      // use viewport width thresholds instead of forcing mobile layout
      // This handles VS Code Simple Browser and DevTools device emulation correctly
      if (ionicMobileDetection || isMobileUserAgent) {
        // For tablet/mobile devices: Use viewport width to determine layout
        // Tablets in landscape at wide resolution should use desktop layout
        setIsMobileDevice(prevIsMobile => {
          if (prevIsMobile) {
            return width <= DESKTOP_THRESHOLD;
          }
          return width <= MOBILE_THRESHOLD;
        });
        return;
      }
      
      // For desktop/browser: Use hysteresis to prevent rapid layout switching
      
      setIsMobileDevice(prevIsMobile => {
        // If currently in mobile mode, only switch to desktop if width exceeds desktop threshold
        if (prevIsMobile) {
          return width <= DESKTOP_THRESHOLD;
        }
        // If currently in desktop mode, only switch to mobile if width falls below mobile threshold
        return width <= MOBILE_THRESHOLD;
      });
      
      // Debug logging
      console.log('🔍 Mobile detection:', {
        platforms,
        ionicMobileDetection,
        isMobileUserAgent,
        windowWidth: width,
        currentState: isMobileDevice,
        thresholds: { mobile: MOBILE_THRESHOLD, desktop: DESKTOP_THRESHOLD }
      });
    };

    checkMobile();
    
    // Recheck on window resize to catch DevTools viewport changes
    // Debounced to reduce excessive recalculations
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150); // Slightly longer delay for smoother transitions
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return isMobileDevice;
};
