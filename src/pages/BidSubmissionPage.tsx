// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonSpinner,
  IonAlert,
  IonIcon,
  IonItem,
  IonInput
} from '@ionic/react';
import { documentTextOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { RfpForm } from '../components/forms/RfpForm';
import { RFPService } from '../services/rfpService';
import { UserContextService } from '../services/userContextService';
import { supabase } from '../supabaseClient';
import type { RFP, FormSpec, Bid } from '../types/rfp';

// Empty interface serves as a base for future extension
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BidSubmissionPageProps {
  // Optional props can be added here if needed
}

export const BidSubmissionPage: React.FC<BidSubmissionPageProps> = () => {
  const location = useLocation();
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [formSpec, setFormSpec] = useState<FormSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [supplierInfo, setSupplierInfo] = useState({
    name: '',
    email: '',
    company: ''
  });
  const [bidData, setBidData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const loadRfpData = async () => {
      try {
        // Parse URL parameters
        const params = new URLSearchParams(location.search);
        const rfpIdParam = params.get('rfp_id');
        const supplierName = params.get('supplier_name');
        const supplierEmail = params.get('supplier_email');

        if (!rfpIdParam) {
          setError('Invalid submission link - RFP ID not found');
          setLoading(false);
          return;
        }

        const rfpId = parseInt(rfpIdParam, 10);
        if (isNaN(rfpId)) {
          setError('Invalid RFP ID');
          setLoading(false);
          return;
        }

        // Load RFP data
        const rfpData = await RFPService.getById(rfpId);
        if (!rfpData) {
          setError('RFP not found');
          setLoading(false);
          return;
        }

        setRfp(rfpData);

        // Get current session ID for better artifact matching
        let currentSessionId: string | null = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            currentSessionId = await UserContextService.getCurrentSession(user.id);
            console.log('Current session ID for bid form search:', currentSessionId);
          }
        } catch (error) {
          console.warn('Could not get current session ID:', error);
        }

        // Load the bid form for this RFP
        console.log('🔍 Loading bid form for RFP:', rfpId, 'with session context:', currentSessionId);
        const bidFormSpec = await RFPService.getBidFormForRfp(rfpId);
        if (!bidFormSpec) {
          setError('This RFP does not have a bid form configured');
          setLoading(false);
          return;
        }

        console.log('✅ Found bid form for RFP:', rfpId);
        setFormSpec(bidFormSpec);

        // Pre-fill supplier info if provided in URL
        if (supplierName || supplierEmail) {
          setSupplierInfo({
            name: supplierName || '',
            email: supplierEmail || '',
            company: ''
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading RFP data:', err);
        setError('Failed to load RFP data');
        setLoading(false);
      }
    };

    loadRfpData();
  }, [location.search]);

  const handleSupplierInfoChange = (field: string, value: string) => {
    setSupplierInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBidDataChange = (data: Record<string, unknown>) => {
    setBidData(data);
  };

  const handleSubmitBid = async (formData: Record<string, unknown>) => {
    if (!rfp || !formSpec) return;

    // Validate supplier info
    if (!supplierInfo.name.trim() || !supplierInfo.email.trim()) {
      setAlertMessage('Please provide your name and email address before submitting.');
      setShowAlert(true);
      return;
    }

    setSubmitting(true);

    try {
      // Create bid record - store everything in response field to match DB schema
      const bidData: Partial<Bid> = {
        rfp_id: rfp.id,
        agent_id: 0, // Use 0 as default for system-generated bids
        response: {
          supplier_info: supplierInfo,
          default_values: formData, // Form response data
          submitted_at: new Date().toISOString(),
          form_version: formSpec.version
        }
      };

      console.log('📝 Attempting to create bid with data:', JSON.stringify(bidData, null, 2));

      const createdBid = await RFPService.createBid(bidData);
      
      if (createdBid) {
        // Generate and store request in RFP record
        try {
          console.log('🔄 Generating request for RFP...');
          const proposal = await RFPService.generateRequest(rfp, formData, supplierInfo);
          
          // Store the request in the RFP record
          await RFPService.updateRfpRequest(rfp.id, proposal);
          
          // Store the questionnaire response (the form data that was used to generate the proposal)
          await RFPService.updateRfpBuyerQuestionnaireResponse(rfp.id, {
            supplier_info: supplierInfo,
            default_values: formData,
            generated_at: new Date().toISOString(),
            bid_id: createdBid.id
          });
          
          console.log('✅ Proposal generated and stored successfully');
        } catch (proposalError) {
          console.error('⚠️ Error generating proposal:', proposalError);
          // Don't fail the bid submission if proposal generation fails
        }
        
        setSubmitted(true);
        setAlertMessage('Your bid has been submitted successfully!');
        setShowAlert(true);
      } else {
        throw new Error('Failed to create bid record');
      }
    } catch (err) {
      console.error('Error submitting bid:', err);
      setAlertMessage('Failed to submit bid. Please try again.');
      setShowAlert(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" style={{ marginTop: '50%' }} />
          <IonText>
            <p>Loading RFP...</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard color="danger">
            <IonCardContent>
              <IonText color="light">
                <h2>Unable to Load RFP</h2>
                <p>{error}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  if (submitted) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Bid Submitted</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard color="success">
            <IonCardContent className="ion-text-center">
              <IonIcon 
                icon={checkmarkCircleOutline} 
                style={{ fontSize: '4rem', color: 'white', marginBottom: '16px' }} 
              />
              <IonText color="light">
                <h2>Bid Submitted Successfully!</h2>
                <p>Thank you for your submission. We will review your bid and contact you if needed.</p>
                <p><strong>RFP:</strong> {rfp?.name}</p>
                <p><strong>Submitted by:</strong> {supplierInfo.name}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Submit Bid</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        {/* RFP Information */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={documentTextOutline} style={{ marginRight: '8px' }} />
              {rfp?.name}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {rfp?.description && (
              <IonText>
                <p>{rfp.description}</p>
              </IonText>
            )}
            <IonText color="medium">
              <p><strong>Due Date:</strong> {rfp?.due_date ? new Date(rfp.due_date).toLocaleDateString() : 'Not specified'}</p>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Supplier Information */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Your Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonInput
                label="Name *"
                value={supplierInfo.name}
                placeholder="Your full name"
                onIonInput={(e) => handleSupplierInfoChange('name', e.detail.value || '')}
              />
            </IonItem>
            
            <IonItem>
              <IonInput
                label="Email *"
                type="email"
                value={supplierInfo.email}
                placeholder="your.email@company.com"
                onIonInput={(e) => handleSupplierInfoChange('email', e.detail.value || '')}
              />
            </IonItem>
            
            <IonItem>
              <IonInput
                label="Company"
                value={supplierInfo.company}
                placeholder="Your company name (optional)"
                onIonInput={(e) => handleSupplierInfoChange('company', e.detail.value || '')}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Bid Form */}
        {formSpec && (
          <RfpForm
            formSpec={formSpec}
            formData={bidData}
            onChange={handleBidDataChange}
            onSubmit={handleSubmitBid}
            loading={submitting}
            submitButtonText="Submit Bid"
            title="Bid Details"
          />
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Bid Submission"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default BidSubmissionPage;
