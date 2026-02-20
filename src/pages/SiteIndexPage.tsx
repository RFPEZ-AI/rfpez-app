// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonIcon,
  IonSpinner,
  IonText,
  IonButton
} from '@ionic/react';
import { globe, home } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { SpecialtySiteService } from '../services/specialtySiteService';
import { SpecialtySite } from '../types/database';

/**
 * SiteIndexPage - Displays available specialty sites when a non-existent URL is accessed
 * Shows a list of all active specialty sites and allows user to select one
 */
const SiteIndexPage: React.FC = () => {
  const history = useHistory();
  const [sites, setSites] = useState<SpecialtySite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeSites = await SpecialtySiteService.getActiveSpecialtySites();
      setSites(activeSites);
    } catch (err) {
      console.error('Error loading sites:', err);
      setError('Failed to load available sites');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSelect = (slug: string) => {
    if (slug === 'home') {
      history.push('/home');
    } else {
      history.push(`/${slug}`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div slot="start" style={{ display: 'flex', alignItems: 'center', marginLeft: '16px' }}>
            <img 
              src="/assets/logo.svg" 
              alt="Expert Alliance" 
              style={{ height: '40px', width: '40px' }}
            />
          </div>
          <IonTitle>Available Sites</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={globe} style={{ marginRight: '8px' }} />
              Select a Site
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>The page you requested doesn&apos;t exist. Please select one of the available sites below:</p>
            </IonText>

            {loading && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <IonSpinner />
                <p>Loading available sites...</p>
              </div>
            )}

            {error && (
              <IonText color="danger">
                <p>{error}</p>
                <IonButton onClick={loadSites} size="small">
                  Retry
                </IonButton>
              </IonText>
            )}

            {!loading && !error && sites.length === 0 && (
              <IonText color="medium">
                <p>No sites available at the moment.</p>
              </IonText>
            )}

            {!loading && !error && sites.length > 0 && (
              <IonList>
                {/* Always show Home option first */}
                <IonItem 
                  button 
                  onClick={() => handleSiteSelect('home')}
                  detail
                  data-testid="site-home"
                >
                  <IonIcon icon={home} slot="start" />
                  <div>
                    <h3>Home</h3>
                    <p style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                      Main application home page
                    </p>
                  </div>
                </IonItem>

                {/* Show all specialty sites */}
                {sites.map((site) => (
                  <IonItem
                    key={site.id}
                    button
                    onClick={() => handleSiteSelect(site.slug)}
                    detail
                    data-testid={`site-${site.slug}`}
                  >
                    <IonIcon icon={globe} slot="start" />
                    <div>
                      <h3>{site.name}</h3>
                      <p style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                        {site.description || 'Specialty procurement site'}
                      </p>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default SiteIndexPage;
