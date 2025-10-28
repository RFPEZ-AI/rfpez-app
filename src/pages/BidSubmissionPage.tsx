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
import { documentTextOutline, checkmarkCircleOutline, mailOutline } from 'ionicons/icons';
import { RfpForm } from '../components/forms/RfpForm';
import { RFPService } from '../services/rfpService';
import { UserContextService } from '../services/userContextService';
import { supabase } from '../supabaseClient';
import type { RFP, FormSpec, Bid } from '../types/rfp';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Empty interface serves as a base for future extension
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BidSubmissionPageProps {
  // Optional props can be added here if needed
}

export const BidSubmissionPage: React.FC<BidSubmissionPageProps> = () => {
  const location = useLocation();
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [formSpec, setFormSpec] = useState<FormSpec | null>(null);
  const [requestEmailContent, setRequestEmailContent] = useState<string | null>(null);
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

        // Load RFP request email artifact
        console.log('🔍 Loading RFP request email artifact for RFP:', rfpId);
        try {
          // Query through the rfp_artifacts junction table to get the request email artifact
          const { data: rfpArtifactLinks, error: linkError } = await supabase
            .from('rfp_artifacts')
            .select('artifact_id')
            .eq('rfp_id', rfpId)
            .limit(100); // Get all artifact links for this RFP

          if (linkError) {
            console.warn('Error loading RFP artifact links:', linkError);
          } else if (rfpArtifactLinks && rfpArtifactLinks.length > 0) {
            // Get the artifact IDs
            const artifactIds = rfpArtifactLinks.map(link => link.artifact_id);
            
            // Now fetch the actual request email artifact
            const { data: requestArtifacts, error: artifactError } = await supabase
              .from('artifacts')
              .select('processed_content, draft_data')
              .in('id', artifactIds)
              .eq('artifact_role', 'rfp_request_email')
              .order('created_at', { ascending: false })
              .limit(1);

            if (artifactError) {
              console.warn('Error loading request email artifact:', artifactError);
            } else if (requestArtifacts && requestArtifacts.length > 0) {
              // Use processed_content if available, otherwise try draft_data
              const artifact = requestArtifacts[0];
              const emailContent = artifact.processed_content || 
                                 (artifact.draft_data && typeof artifact.draft_data === 'object' && 'content' in artifact.draft_data 
                                   ? (artifact.draft_data as { content?: string }).content 
                                   : null);
              
              if (emailContent) {
                console.log('✅ Found RFP request email artifact');
                setRequestEmailContent(emailContent);
              } else {
                console.log('⚠️ Request email artifact found but has no content');
              }
            } else {
              console.log('ℹ️ No request email artifact found for this RFP');
            }
          } else {
            console.log('ℹ️ No artifacts linked to this RFP');
          }
        } catch (artifactErr) {
          console.warn('Could not load request email artifact:', artifactErr);
        }

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
          <IonTitle>Submit Bid - {rfp?.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        {/* RFP Request Email Content */}
        {requestEmailContent && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={mailOutline} style={{ marginRight: '8px' }} />
                Request for Proposal
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="rfp-email-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p style={{
                        lineHeight: '1.6',
                        marginBottom: '12px',
                        fontSize: '14px'
                      }}>
                        {children}
                      </p>
                    ),
                    h1: ({ children }) => (
                      <h1 style={{
                        fontSize: '1.8em',
                        fontWeight: 'bold',
                        marginBottom: '16px',
                        marginTop: '24px',
                        color: 'var(--ion-color-primary)',
                        borderBottom: '2px solid var(--ion-color-primary-tint)',
                        paddingBottom: '8px'
                      }}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 style={{
                        fontSize: '1.5em',
                        fontWeight: 'bold',
                        marginBottom: '12px',
                        marginTop: '20px',
                        color: 'var(--ion-color-primary)'
                      }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 style={{
                        fontSize: '1.3em',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        marginTop: '16px',
                        color: 'var(--ion-color-primary)'
                      }}>
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => (
                      <ul style={{
                        marginBottom: '12px',
                        paddingLeft: '20px'
                      }}>
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li style={{
                        marginBottom: '4px',
                        lineHeight: '1.5'
                      }}>
                        {children}
                      </li>
                    ),
                  }}
                >
                  {requestEmailContent}
                </ReactMarkdown>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* RFP Basic Information (fallback if no request content) */}
        {!requestEmailContent && (
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
              {rfp?.specification && (
                <IonText>
                  <h3>Specifications</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{rfp.specification}</p>
                </IonText>
              )}
              <IonText color="medium">
                <p><strong>Due Date:</strong> {rfp?.due_date ? new Date(rfp.due_date).toLocaleDateString() : 'Not specified'}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

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
