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
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput
} from '@ionic/react';
import { documentTextOutline, sendOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { RfpForm } from '../components/forms/RfpForm';
import { RFPService } from '../services/rfpService';
import type { RFP, FormSpec } from '../types/rfp';

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
  const [bidData, setBidData] = useState<Record<string, any>>({});

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

        // Check if RFP has a form spec
        if (!rfpData.form_spec) {
          setError('This RFP does not have a bid form configured');
          setLoading(false);
          return;
        }

        setFormSpec(rfpData.form_spec);

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

  const handleBidDataChange = (data: Record<string, any>) => {
    setBidData(data);
  };

  const handleSubmitBid = async (formData: Record<string, any>) => {
    if (!rfp || !formSpec) return;

    // Validate supplier info
    if (!supplierInfo.name.trim() || !supplierInfo.email.trim()) {
      setAlertMessage('Please provide your name and email address before submitting.');
      setShowAlert(true);
      return;
    }

    setSubmitting(true);

    try {
      // Create bid record
      const bidData = {
        rfp_id: rfp.id,
        agent_id: 1, // TODO: Handle agent assignment properly
        response: formData,
        document: {
          supplier_info: supplierInfo,
          submitted_at: new Date().toISOString(),
          form_version: formSpec.version
        }
      };

      const createdBid = await RFPService.createBid(bidData);
      
      if (createdBid) {
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
              <IonLabel position="stacked">Name *</IonLabel>
              <IonInput
                value={supplierInfo.name}
                placeholder="Your full name"
                onIonInput={(e) => handleSupplierInfoChange('name', e.detail.value!)}
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Email *</IonLabel>
              <IonInput
                type="email"
                value={supplierInfo.email}
                placeholder="your.email@company.com"
                onIonInput={(e) => handleSupplierInfoChange('email', e.detail.value!)}
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Company</IonLabel>
              <IonInput
                value={supplierInfo.company}
                placeholder="Your company name (optional)"
                onIonInput={(e) => handleSupplierInfoChange('company', e.detail.value!)}
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
