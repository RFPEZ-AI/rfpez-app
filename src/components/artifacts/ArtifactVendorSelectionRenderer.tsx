// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
  IonBadge,
  IonIcon
} from '@ionic/react';
import { checkmarkCircle, personOutline, timeOutline } from 'ionicons/icons';
import { Artifact } from '../../types/home';

interface VendorSelectionSchema {
  vendors: Array<{
    id: string;
    name: string;
    selected: boolean;
    selectedAt?: string;
    metadata?: {
      email?: string;
      phone?: string;
      contact?: string;
      [key: string]: unknown;
    };
  }>;
  lastModified?: string;
  autoSaveEnabled?: boolean;
}

interface ArtifactVendorSelectionRendererProps {
  artifact: Artifact;
  onSelectionChange?: (vendorId: string, selected: boolean) => void;
}

/**
 * Vendor Selection Renderer Component
 * Displays vendor list with checkboxes for selection tracking
 * Supports auto-save functionality and real-time updates
 */
export const ArtifactVendorSelectionRenderer: React.FC<ArtifactVendorSelectionRendererProps> = ({
  artifact,
  onSelectionChange
}) => {
  const [schema, setSchema] = useState<VendorSelectionSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse artifact schema on mount and when artifact changes
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      if (!artifact.schema) {
        setError('No vendor selection data available');
        setIsLoading(false);
        return;
      }

      // Parse schema
      const parsedSchema = artifact.schema as unknown as VendorSelectionSchema;
      
      if (!parsedSchema.vendors || !Array.isArray(parsedSchema.vendors)) {
        setError('Invalid vendor selection schema');
        setIsLoading(false);
        return;
      }

      setSchema(parsedSchema);
      setIsLoading(false);
    } catch (err) {
      console.error('Error parsing vendor selection schema:', err);
      setError('Failed to load vendor selection data');
      setIsLoading(false);
    }
  }, [artifact]);

  // Handle checkbox toggle
  const handleToggle = (vendorId: string, currentlySelected: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(vendorId, !currentlySelected);
    }

    // Optimistically update local state
    setSchema(prevSchema => {
      if (!prevSchema) return prevSchema;
      
      return {
        ...prevSchema,
        vendors: prevSchema.vendors.map(vendor =>
          vendor.id === vendorId
            ? {
                ...vendor,
                selected: !currentlySelected,
                selectedAt: !currentlySelected ? new Date().toISOString() : undefined
              }
            : vendor
        ),
        lastModified: new Date().toISOString()
      };
    });
  };

  // Calculate selection statistics
  const selectedCount = schema?.vendors.filter(v => v.selected).length || 0;
  const totalCount = schema?.vendors.length || 0;
  const selectionPercentage = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

  // Format timestamp for display
  const formatTimestamp = (isoString?: string): string => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  // Loading state
  if (isLoading) {
    return (
      <IonCard>
        <IonCardContent className="ion-text-center">
          <IonSpinner name="crescent" />
          <IonText>
            <p>Loading vendor selection...</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  // Error state
  if (error || !schema) {
    return (
      <IonCard color="danger">
        <IonCardContent>
          <IonText color="danger">
            <h3>Error Loading Vendor Selection</h3>
            <p>{error || 'Unknown error occurred'}</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={personOutline} className="ion-margin-end" />
          {artifact.name || 'Vendor Selection'}
        </IonCardTitle>
        <IonCardSubtitle>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <IonBadge color={selectedCount > 0 ? 'success' : 'medium'}>
              <IonIcon icon={checkmarkCircle} className="ion-margin-end" />
              {selectedCount} of {totalCount} selected ({selectionPercentage}%)
            </IonBadge>
            {schema.lastModified && (
              <IonNote>
                <IonIcon icon={timeOutline} className="ion-margin-end" />
                Last updated: {formatTimestamp(schema.lastModified)}
              </IonNote>
            )}
          </div>
        </IonCardSubtitle>
      </IonCardHeader>
      
      <IonCardContent>
        {schema.vendors.length === 0 ? (
          <IonText color="medium">
            <p className="ion-text-center">No vendors available for selection</p>
          </IonText>
        ) : (
          <IonList>
            {schema.vendors.map((vendor) => (
              <IonItem key={vendor.id} lines="full">
                <IonCheckbox
                  slot="start"
                  checked={vendor.selected}
                  onIonChange={() => handleToggle(vendor.id, vendor.selected)}
                  disabled={!onSelectionChange}
                />
                <IonLabel>
                  <h2>{vendor.name}</h2>
                  {vendor.metadata && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {vendor.metadata.email && (
                        <IonNote style={{ display: 'block' }}>
                          Email: {vendor.metadata.email}
                        </IonNote>
                      )}
                      {vendor.metadata.phone && (
                        <IonNote style={{ display: 'block' }}>
                          Phone: {vendor.metadata.phone}
                        </IonNote>
                      )}
                      {vendor.metadata.contact && (
                        <IonNote style={{ display: 'block' }}>
                          Contact: {vendor.metadata.contact}
                        </IonNote>
                      )}
                    </div>
                  )}
                  {vendor.selected && vendor.selectedAt && (
                    <IonNote style={{ display: 'block', marginTop: '0.5rem' }}>
                      <IonIcon icon={checkmarkCircle} color="success" className="ion-margin-end" />
                      Selected: {formatTimestamp(vendor.selectedAt)}
                    </IonNote>
                  )}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ArtifactVendorSelectionRenderer;
