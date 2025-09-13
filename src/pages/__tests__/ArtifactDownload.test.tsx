// Mock the DocxExporter
jest.mock('../../utils/docxExporter', () => ({
  DocxExporter: {
    downloadBidDocx: jest.fn()
  }
}));

// Mock confirm dialog
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn().mockReturnValue(true),
});

import { DocxExporter } from '../../utils/docxExporter';
import { Artifact } from '../../types/home';
import { RFP } from '../../types/rfp';

// Mock implementation of the download function from Home.tsx
const createMockDownloadHandler = (currentRfp: RFP | null) => {
  return async (artifact: Artifact) => {
    try {
      // Check if it's a form artifact or document with form-like content
      if ((artifact.type === 'form' || artifact.type === 'document') && artifact.content) {
        try {
          const formData = JSON.parse(artifact.content);
          
          // Check if it's a buyer questionnaire with schema (structured form)
          if (formData.schema && typeof formData.schema === 'object') {
            const formSpec = {
              version: 'rfpez-form@1' as const,
              schema: formData.schema,
              uiSchema: formData.uiSchema || {},
              defaults: formData.formData || {}
            };
            
            // Get actual submitted response data from the current RFP
            let responseData: Record<string, unknown> = {};
            
            if (currentRfp) {
              if (artifact.name.toLowerCase().includes('buyer') || 
                  artifact.name.toLowerCase().includes('questionnaire') ||
                  artifact.id.startsWith('buyer-form-')) {
                responseData = (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || {};
              } else if (artifact.name.toLowerCase().includes('bid') || 
                        artifact.name.toLowerCase().includes('supplier') ||
                        artifact.id.startsWith('bid-form-')) {
                responseData = formData.formData || {};
              } else {
                responseData = (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || formData.formData || {};
              }
            } else {
              responseData = formData.formData || {};
            }
            
            if (Object.keys(responseData).length === 0) {
              const proceed = confirm(
                'This form has not been submitted yet or has no response data. ' +
                'The downloaded document will contain empty fields for you to fill out. Do you want to continue?'
              );
              if (!proceed) {
                return;
              }
              responseData = formData.formData || {};
            }
            
            const exportOptions = {
              title: formData.title || artifact.name || 'Form Response',
              filename: `${artifact.name || 'form-response'}.docx`,
              companyName: (responseData.companyName as string) || 'Your Company',
              rfpName: currentRfp?.name || 'RFP Response',
              submissionDate: new Date(),
              includeHeaders: true
            };
            
            await DocxExporter.downloadBidDocx(formSpec, responseData, exportOptions);
            return;
          } else if (artifact.type === 'form') {
            // Only show this error for actual form artifacts without schema
            throw new Error('Form artifact does not have valid schema structure');
          }
        } catch (jsonError) {
          // If JSON parsing fails and it's a form, show error
          if (artifact.type === 'form') {
            throw new Error('Form artifact has invalid JSON content');
          }
          // If it's a document that's not JSON, fall through to basic download
        }
      }
    } catch (error) {
      console.error('Error downloading artifact:', error);
    }
  };
};

describe('Artifact Download Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form artifact download with submitted response data', () => {
    it('should use submitted buyer questionnaire response data instead of defaults', async () => {
      const mockRfp: RFP = {
        id: 1,
        name: 'Test RFP',
        description: 'Test Description',
        due_date: '2024-12-31',
        specification: 'Test Specification',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        is_template: false,
        is_public: false,
        suppliers: [],
        agent_ids: [],
        // This is the submitted form data that should be used
        buyer_questionnaire_response: {
          companyName: 'Acme Corp',
          projectBudget: 50000,
          requiredDeliveryDate: '2024-12-31',
          projectDescription: 'LED lighting upgrade for office building'
        }
      };

      const mockArtifact: Artifact = {
        id: 'buyer-form-1',
        name: 'Buyer Questionnaire',
        type: 'form',
        size: 'Interactive Form',
        content: JSON.stringify({
          title: 'LED Lighting Requirements Questionnaire',
          schema: {
            type: 'object',
            properties: {
              companyName: { type: 'string', title: 'Company Name' },
              projectBudget: { type: 'number', title: 'Project Budget' },
              requiredDeliveryDate: { type: 'string', title: 'Required Delivery Date' },
              projectDescription: { type: 'string', title: 'Project Description' }
            }
          },
          uiSchema: {},
          // These are the default values - should NOT be used
          formData: {
            companyName: 'Your Company',
            projectBudget: 0,
            requiredDeliveryDate: '',
            projectDescription: ''
          }
        })
      };

      const handleDownload = createMockDownloadHandler(mockRfp);
      
      await handleDownload(mockArtifact);

      // Verify DocxExporter was called with the submitted response data, not the defaults
      expect(DocxExporter.downloadBidDocx).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: expect.any(Object),
          uiSchema: expect.any(Object),
          defaults: expect.any(Object)
        }),
        // This should be the submitted response data from buyer_questionnaire_response
        {
          companyName: 'Acme Corp',
          projectBudget: 50000,
          requiredDeliveryDate: '2024-12-31',
          projectDescription: 'LED lighting upgrade for office building'
        },
        expect.objectContaining({
          title: 'LED Lighting Requirements Questionnaire',
          companyName: 'Acme Corp',
          rfpName: 'Test RFP'
        })
      );
    });

    it('should handle bid forms correctly (use defaults for now)', async () => {
      const mockRfp: RFP = {
        id: 1,
        name: 'Test RFP',
        description: 'Test Description',
        due_date: '2024-12-31',
        specification: 'Test Specification',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        is_template: false,
        is_public: false,
        suppliers: [],
        agent_ids: [],
        buyer_questionnaire_response: {
          companyName: 'Buyer Corp'
        }
      };

      const mockArtifact: Artifact = {
        id: 'bid-form-1',
        name: 'Supplier Bid Form',
        type: 'form',
        size: 'Interactive Form',
        content: JSON.stringify({
          title: 'Supplier Bid Submission',
          schema: {
            type: 'object',
            properties: {
              supplierName: { type: 'string', title: 'Supplier Name' }
            }
          },
          formData: {
            supplierName: 'Your Supplier Name'
          }
        })
      };

      const handleDownload = createMockDownloadHandler(mockRfp);
      
      await handleDownload(mockArtifact);

      // For bid forms, should use form defaults (not buyer_questionnaire_response)
      expect(DocxExporter.downloadBidDocx).toHaveBeenCalledWith(
        expect.any(Object),
        {
          supplierName: 'Your Supplier Name'
        },
        expect.any(Object)
      );
    });

    it('should handle document artifacts with form schema correctly', async () => {
      const mockRfp: RFP = {
        id: 1,
        name: 'Test RFP',
        description: 'Test Description',
        due_date: '2024-12-31',
        specification: 'Test Specification',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        is_template: false,
        is_public: false,
        suppliers: [],
        agent_ids: []
      };

      const mockArtifact: Artifact = {
        id: 'proposal-doc-1',
        name: 'RFP Proposal Document',
        type: 'document', // This is a document, not a form
        size: 'Document',
        content: JSON.stringify({
          title: 'RFP Proposal Template',
          schema: {
            type: 'object',
            properties: {
              proposalTitle: { type: 'string', title: 'Proposal Title' },
              executiveSummary: { type: 'string', title: 'Executive Summary' },
              totalCost: { type: 'number', title: 'Total Cost' }
            }
          },
          formData: {
            proposalTitle: '',
            executiveSummary: '',
            totalCost: 0
          }
        })
      };

      const handleDownload = createMockDownloadHandler(mockRfp);
      
      await handleDownload(mockArtifact);

      // Should still process document with form schema and create fillable document
      expect(DocxExporter.downloadBidDocx).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: expect.any(Object),
          uiSchema: expect.any(Object),
          defaults: expect.any(Object)
        }),
        {
          proposalTitle: '',
          executiveSummary: '',
          totalCost: 0
        },
        expect.objectContaining({
          title: 'RFP Proposal Template',
          rfpName: 'Test RFP'
        })
      );
    });
  });
});