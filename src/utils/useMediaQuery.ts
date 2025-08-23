import { useState, useEffect } from 'react';

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
 * Hook to detect mobile/narrow screens
 * @returns boolean indicating if screen is mobile/narrow
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 768px)');
};
