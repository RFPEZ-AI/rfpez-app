// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonList, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner, IonChip, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons } from '@ionic/react';
import { eyeOutline, closeOutline, documentTextOutline, personOutline, cashOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';

// Utility function to extract total cost from bid response
const extractTotalCost = (response: Record<string, unknown>): string => {
  // Common field names for total cost
  const costFields = ['total_cost', 'totalCost', 'total_price', 'totalPrice', 'cost', 'price', 'amount', 'total'];
  
  for (const field of costFields) {
    const value = response[field];
    if (value !== null && value !== undefined && value !== '') {
      // If it's a number, format it as currency
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      // If it's a string that looks like a number, try to parse it
      const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(numValue);
      }
      // Otherwise return as string
      return String(value);
    }
  }
  
  return 'Not specified';
};

interface BidViewProps {
  currentRfpId: number | null;
  rfpName?: string;
}

interface Bid {
  id: number;
  rfp_id: number;
  supplier_id: number;
  response: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
}

interface BidDetailModalProps {
  bid: Bid | null;
  isOpen: boolean;
  onClose: () => void;
}

const BidDetailModal: React.FC<BidDetailModalProps> = ({ bid, isOpen, onClose }) => {
  if (!bid) return null;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderFormData = (data: Record<string, unknown>) => {
    return Object.entries(data).map(([key, value]) => (
      <div key={key} style={{ marginBottom: '12px' }}>
        <strong style={{ 
          color: 'var(--ion-color-primary)', 
          fontSize: '14px',
          textTransform: 'capitalize'
        }}>
          {key.replace(/_/g, ' ')}:
        </strong>
        <div style={{ 
          marginTop: '4px', 
          padding: '8px 12px',
          backgroundColor: 'var(--ion-color-light)',
          borderRadius: '4px',
          fontSize: '14px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {formatValue(value)}
        </div>
      </div>
    ));
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bid Details - {bid.supplier_name || `Supplier ${bid.supplier_id}`}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '20px' }}>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '18px' }}>
                  <IonIcon icon={personOutline} style={{ marginRight: '8px' }} />
                  {bid.supplier_name || `Supplier ${bid.supplier_id}`}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p><strong>Total Cost:</strong> {extractTotalCost(bid.response)}</p>
                <p><strong>Submitted:</strong> {new Date(bid.created_at).toLocaleDateString()}</p>
                {bid.updated_at !== bid.created_at && (
                  <p><strong>Last Updated:</strong> {new Date(bid.updated_at).toLocaleDateString()}</p>
                )}
              </IonCardContent>
            </IonCard>
          </div>

          <div>
            <h3 style={{ 
              marginBottom: '16px', 
              color: 'var(--ion-color-primary)',
              borderBottom: '2px solid var(--ion-color-primary-tint)',
              paddingBottom: '8px'
            }}>
              Bid Response Details
            </h3>
            {renderFormData(bid.response)}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

const BidView: React.FC<BidViewProps> = ({ currentRfpId, rfpName }) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    const loadBids = async () => {
      if (!currentRfpId) {
        setError('No RFP selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading bids for RFP ID:', currentRfpId);

        // First, get bids without join to avoid relationship errors
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select(`
            id,
            rfp_id,
            agent_id,
            supplier_id,
            response,
            created_at,
            updated_at
          `)
          .eq('rfp_id', currentRfpId)
          .order('created_at', { ascending: false });

        if (bidsError) {
          console.error('Error fetching bids:', bidsError);
          throw new Error(`Failed to load bids: ${bidsError.message}`);
        }

        if (!bidsData || bidsData.length === 0) {
          setBids([]);
          return;
        }

        // Extract supplier info from response data instead of using supplier_id
        // (supplier_id column has caching issues)

        // Transform the data to include supplier name from response
        const transformedBids = bidsData.map((bidRow): Bid => {
          // Extract supplier name from response.supplier_info
          let supplierName = 'Anonymous Supplier';
          if (bidRow.response && typeof bidRow.response === 'object') {
            const response = bidRow.response;
            const supplierInfo = response.supplier_info as Record<string, unknown> | undefined;
            if (supplierInfo && typeof supplierInfo.name === 'string') {
              supplierName = supplierInfo.name;
            }
          }
          
          return {
            ...bidRow, // Include all original fields
            supplier_name: supplierName
          };
        });

        console.log('Loaded bids successfully:', transformedBids.length);
        setBids(transformedBids);
      } catch (err) {
        console.error('Error loading bids:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bids');
      } finally {
        setLoading(false);
      }
    };

    loadBids();
  }, [currentRfpId]);

  const handleBidClick = (bid: Bid) => {
    setSelectedBid(bid);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedBid(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        flexDirection: 'column' 
      }}>
        <IonSpinner name="crescent" />
        <p style={{ marginTop: '16px', color: 'var(--ion-color-medium)' }}>
          Loading bids...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '32px', 
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <IonIcon 
          icon={documentTextOutline} 
          style={{ fontSize: '48px', color: 'var(--ion-color-medium)', marginBottom: '16px' }} 
        />
        <h3 style={{ color: 'var(--ion-color-danger)', marginBottom: '8px' }}>
          Error Loading Bids
        </h3>
        <p style={{ color: 'var(--ion-color-medium)' }}>
          {error}
        </p>
      </div>
    );
  }

  if (!currentRfpId) {
    return (
      <div style={{ 
        padding: '32px', 
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <IonIcon 
          icon={documentTextOutline} 
          style={{ fontSize: '48px', color: 'var(--ion-color-medium)', marginBottom: '16px' }} 
        />
        <h3 style={{ color: 'var(--ion-color-medium)', marginBottom: '8px' }}>
          No RFP Selected
        </h3>
        <p style={{ color: 'var(--ion-color-medium)' }}>
          Please select an RFP to view its bids.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid var(--ion-color-light-shade)',
        backgroundColor: 'var(--ion-color-light)',
        flexShrink: 0
      }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          color: 'var(--ion-color-primary)',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          <IonIcon icon={documentTextOutline} style={{ marginRight: '8px' }} />
          Bids for: {rfpName || `RFP #${currentRfpId}`}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IonChip color="primary">
            <IonIcon icon={documentTextOutline} />
            <span>{bids.length} {bids.length === 1 ? 'Bid' : 'Bids'}</span>
          </IonChip>
        </div>
      </div>

      {/* Bids List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {bids.length === 0 ? (
          <div style={{ 
            padding: '32px', 
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <IonIcon 
              icon={documentTextOutline} 
              style={{ fontSize: '48px', color: 'var(--ion-color-medium)', marginBottom: '16px' }} 
            />
            <h3 style={{ color: 'var(--ion-color-medium)', marginBottom: '8px' }}>
              No Bids Submitted
            </h3>
            <p style={{ color: 'var(--ion-color-medium)' }}>
              No suppliers have submitted bids for this RFP yet.
            </p>
          </div>
        ) : (
          <IonList>
            {bids.map((bid) => (
              <IonItem 
                key={bid.id} 
                button 
                onClick={() => handleBidClick(bid)}
                style={{ '--border-color': 'var(--ion-color-light-shade)' }}
              >
                <IonIcon 
                  icon={personOutline} 
                  slot="start" 
                  color="primary"
                />
                <IonLabel>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {bid.supplier_name || `Supplier ${bid.supplier_id}`}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <IonChip color="secondary">
                      <IonIcon icon={cashOutline} />
                      <span>{extractTotalCost(bid.response)}</span>
                    </IonChip>
                    <span style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                      Bid #{bid.id}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', margin: 0 }}>
                    Submitted: {new Date(bid.created_at).toLocaleDateString()} at {new Date(bid.created_at).toLocaleTimeString()}
                  </p>
                </IonLabel>
                <IonIcon icon={eyeOutline} slot="end" color="medium" />
              </IonItem>
            ))}
          </IonList>
        )}
      </div>

      {/* Bid Detail Modal */}
      <BidDetailModal 
        bid={selectedBid}
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default BidView;