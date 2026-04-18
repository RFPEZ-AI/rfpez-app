// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SpecialtySiteService } from '../services/specialtySiteService';
import Home from './Home';
import SiteIndexPage from './SiteIndexPage';
import { IonSpinner } from '@ionic/react';

/**
 * SpecialtyRouteHandler - Validates specialty site exists before rendering
 * If site doesn't exist, shows SiteIndexPage with available sites
 */
const SpecialtyRouteHandler: React.FC = () => {
  const { specialty } = useParams<{ specialty: string }>();
  const [isValidSite, setIsValidSite] = useState<boolean | null>(null);

  useEffect(() => {
    validateSite();
  }, [specialty]);

  const validateSite = async () => {
    if (!specialty) {
      setIsValidSite(false);
      return;
    }

    try {
      const site = await SpecialtySiteService.getSpecialtySiteBySlug(specialty);
      setIsValidSite(site !== null);
    } catch (err) {
      console.error('Error validating specialty site:', err);
      setIsValidSite(false);
    }
  };

  // Show loading while validating
  if (isValidSite === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <IonSpinner />
      </div>
    );
  }

  // Show site index if invalid specialty
  if (isValidSite === false) {
    return <SiteIndexPage />;
  }

  // Show Home component for valid specialty
  return <Home />;
};

export default SpecialtyRouteHandler;
