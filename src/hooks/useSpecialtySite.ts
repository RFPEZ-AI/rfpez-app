// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SpecialtySite } from '../types/database';
import { SpecialtySiteService } from '../services/specialtySiteService';

/**
 * Hook for managing specialty site state
 * Reads the specialty slug from route parameters and loads the corresponding specialty site
 */
export const useSpecialtySite = () => {
  const { specialty } = useParams<{ specialty?: string }>();
  const [currentSpecialtySite, setCurrentSpecialtySite] = useState<SpecialtySite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadSpecialtySite = async () => {
      console.log('🎯 useSpecialtySite: Loading specialty site for slug:', specialty || 'default');
      setIsLoading(true);
      setError(null);

      try {
        let site: SpecialtySite | null = null;

        if (specialty) {
          // Try to load the specialty site by slug
          site = await SpecialtySiteService.getSpecialtySiteBySlug(specialty);
          
          if (!site) {
            console.warn('⚠️ Specialty site not found for slug:', specialty);
            // Fall back to default specialty site
            site = await SpecialtySiteService.getDefaultSpecialtySite();
          }
        } else {
          // No specialty parameter - load default (home)
          site = await SpecialtySiteService.getDefaultSpecialtySite();
        }

        console.log('✅ Loaded specialty site:', site?.name);
        setCurrentSpecialtySite(site);
      } catch (err) {
        console.error('❌ Error loading specialty site:', err);
        setError(err instanceof Error ? err : new Error('Failed to load specialty site'));
      } finally {
        setIsLoading(false);
      }
    };

    loadSpecialtySite();
  }, [specialty]);

  return {
    currentSpecialtySite,
    specialtySlug: specialty || 'home',
    isLoading,
    error
  };
};
