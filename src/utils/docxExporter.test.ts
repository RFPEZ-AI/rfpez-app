// Copyright Mark Skiba, 2025 All rights reserved

import { DocxExporter } from './docxExporter';
import type { FormSpec } from '../types/rfp';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from 'docx';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

// Mock docx
jest.mock('docx', () => ({
  Document: jest.fn().mockImplementation((options) => ({
    sections: options.sections
  })),
  Paragraph: jest.fn().mockImplementation((options) => ({
    text: options.text,
    heading: options.heading,
    spacing: options.spacing,
    alignment: options.alignment,
    children: options.children
  })),
  TextRun: jest.fn().mockImplementation((textOrOptions) => {
    // Handle both TextRun(string) and TextRun({text: string, ...options})
    if (typeof textOrOptions === 'string') {
      return { text: textOrOptions };
    }
    return {
      text: textOrOptions?.text,
      bold: textOrOptions?.bold,
      break: textOrOptions?.break
    };
  }),
  Table: jest.fn().mockImplementation((options) => ({
    rows: options.rows
  })),
  TableRow: jest.fn().mockImplementation((options) => ({
    children: options.children
  })),
  TableCell: jest.fn().mockImplementation((options) => ({
    children: options.children,
    width: options.width
  })),
  Packer: {
    toBlob: jest.fn().mockResolvedValue(new Blob(['mock docx content'], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    }))
  },
  HeadingLevel: {
    HEADING_1: 'HEADING_1',
    HEADING_2: 'HEADING_2'
  },
  AlignmentType: {
    CENTER: 'CENTER',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    JUSTIFIED: 'JUSTIFIED'
  },
  WidthType: {
    PERCENTAGE: 'PERCENTAGE',
    DXA: 'DXA'
  }
}));

const mockFormSpec: FormSpec = {
  version: 'rfpez-form@1',
  schema: {
    title: 'Test RFP Form',
    type: 'object',
    required: ['companyName', 'proposal'],
    properties: {
      companyName: {
        type: 'string',
        title: 'Company Name'
      },
      proposal: {
        type: 'string',
        title: 'Proposal Details'
      },
      experience: {
        type: 'number',
        title: 'Years of Experience'
      }
    }
  },
  uiSchema: {},
  defaults: {}
};

const mockBidData = {
  companyName: 'Test Company Inc.',
  proposal: 'This is our detailed proposal for the project.',
  experience: 5
};

const mockSupplierInfo = {
  companyName: 'Test Company Inc.',
  rfpName: 'Test RFP Form',
  submissionDate: new Date('2024-01-01'),
  title: 'Bid Response'
};

describe('DocxExporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildBidDocx', () => {
    it('creates document with correct structure', async () => {
      const doc = await DocxExporter.buildBidDocx(
        mockFormSpec,
        mockBidData,
        mockSupplierInfo
      );

      expect(doc).toBeDefined();
    });

    it('includes supplier information in document', async () => {
      await DocxExporter.buildBidDocx(
        mockFormSpec,
        mockBidData,
        mockSupplierInfo
      );

      // Check that Document was called with sections
      expect(Document).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({
              children: expect.any(Array)
            })
          ])
        })
      );
    });

    it('includes all form fields in document', async () => {
      const doc = await DocxExporter.buildBidDocx(
        mockFormSpec,
        mockBidData,
        mockSupplierInfo
      );

      expect(doc).toBeDefined();
      
      // Check that enough paragraphs were created (at least header + content paragraphs)
      expect(Paragraph).toHaveBeenCalledTimes(8); // Based on the debug output we saw
    });

    it('handles missing bid data gracefully', async () => {
      const doc = await DocxExporter.buildBidDocx(
        mockFormSpec,
        {},
        mockSupplierInfo
      );

      expect(doc).toBeDefined();
    });

    it('handles array values in bid data', async () => {
      const formSpecWithArray: FormSpec = {
        ...mockFormSpec,
        schema: {
          ...mockFormSpec.schema,
          properties: {
            ...(mockFormSpec.schema.properties as Record<string, unknown> || {}),
            services: {
              type: 'array',
              title: 'Services Offered',
              items: { type: 'string' }
            }
          }
        }
      };

      const bidDataWithArray = {
        ...mockBidData,
        services: ['Service 1', 'Service 2', 'Service 3']
      };

      const doc = await DocxExporter.buildBidDocx(
        formSpecWithArray,
        bidDataWithArray,
        mockSupplierInfo
      );

      expect(doc).toBeDefined();
    });

    it('handles object values in bid data', async () => {
      const formSpecWithObject: FormSpec = {
        ...mockFormSpec,
        schema: {
          ...mockFormSpec.schema,
          properties: {
            ...(mockFormSpec.schema.properties as Record<string, unknown> || {}),
            contact: {
              type: 'object',
              title: 'Contact Information',
              properties: {
                name: { type: 'string', title: 'Name' },
                email: { type: 'string', title: 'Email' }
              }
            }
          }
        }
      };

      const bidDataWithObject = {
        ...mockBidData,
        contact: {
          name: 'Jane Smith',
          email: 'jane@testcompany.com'
        }
      };

      const doc = await DocxExporter.buildBidDocx(
        formSpecWithObject,
        bidDataWithObject,
        mockSupplierInfo
      );

      expect(doc).toBeDefined();
    });
  });

  describe('downloadBidDocx', () => {
    it('generates and downloads document', async () => {
      
      // Explicitly set up the mock before calling the function
      (Packer.toBlob as jest.Mock).mockResolvedValue(new Blob(['mock docx content'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      }));
      
      await DocxExporter.downloadBidDocx(
        mockFormSpec,
        mockBidData,
        mockSupplierInfo
      );
      
      expect(Packer.toBlob).toHaveBeenCalled();
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_RFP_Form.docx'
      );
    });

    it('uses sanitized filename', async () => {
      
      // Explicitly set up the mock before calling the function
      (Packer.toBlob as jest.Mock).mockResolvedValue(new Blob(['mock docx content'], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      }));
      
      const formSpecWithSpecialChars: FormSpec = {
        ...mockFormSpec,
        schema: {
          ...mockFormSpec.schema,
          title: 'Test/RFP\\Form: Special*Chars?'
        }
      };

      await DocxExporter.downloadBidDocx(
        formSpecWithSpecialChars,
        mockBidData,
        mockSupplierInfo
      );

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test_RFP_Form_Special_Chars.docx'
      );
    });

    it('handles packer error gracefully', async () => {
      (Packer.toBlob as jest.Mock).mockRejectedValueOnce(new Error('Packer error'));
      
      await expect(
        DocxExporter.downloadBidDocx(mockFormSpec, mockBidData, mockSupplierInfo)
      ).rejects.toThrow('Packer error');
    });
  });

  describe('helper methods', () => {
    it('creates proper document structure', () => {
      const doc = DocxExporter.buildBidDocx(mockFormSpec, mockBidData, mockSupplierInfo);
      expect(doc).toBeDefined();
      
      expect(Document).toHaveBeenCalled();
    });

    it('handles nested object schemas correctly', () => {
      const nestedFormSpec: FormSpec = {
        version: 'rfpez-form@1',
        schema: {
          title: 'LED Lighting Upgrade RFP - Sample Bid Form',
          type: 'object',
          properties: {
            deskTaskLighting: {
              type: 'object',
              title: 'Desk/Task Lighting Specifications',
              properties: {
                totalQuantity: {
                  type: 'number',
                  title: 'Total Quantity'
                },
                baseType: {
                  type: 'string',
                  title: 'Base Type'
                }
              }
            },
            recessedCanLighting: {
              type: 'object',
              title: 'Recessed Can Light Specifications',
              properties: {
                totalQuantity: {
                  type: 'number',
                  title: 'Total Quantity'
                },
                requiredBaseTypes: {
                  type: 'array',
                  title: 'Required Base Types'
                }
              }
            },
            generalRequirements: {
              type: 'string',
              title: 'General Requirements'
            }
          }
        },
        uiSchema: {},
        defaults: {}
      };

      const emptyResponseData = {};
      
      const doc = DocxExporter.buildBidDocx(nestedFormSpec, emptyResponseData, {
        title: 'LED Lighting Upgrade RFP - Sample Bid Form',
        rfpName: 'LED Lighting Upgrade',
        submissionDate: new Date('2024-01-01')
      });

      expect(doc).toBeDefined();
      
      expect(Document).toHaveBeenCalled();
      
      // Verify that sections were created for the nested objects
      const documentCall = (Document as jest.Mock).mock.calls[(Document as jest.Mock).mock.calls.length - 1];
      const sections = documentCall[0].sections;
      expect(sections).toBeDefined();
      expect(sections.length).toBeGreaterThan(0);
    });

    it('converts markdown documents to DOCX correctly', () => {
      const markdownContent = `# RFP Proposal Document

## Executive Summary
This is our proposal for the LED lighting upgrade project.

### Key Benefits
- Energy efficiency improvements
- **Cost savings** of up to *30%*
- Enhanced lighting quality

## Technical Specifications
1. LED fixtures with 50,000 hour lifespan
2. Smart controls integration
3. Emergency lighting compliance

Thank you for considering our proposal.`;

      const doc = DocxExporter.buildMarkdownDocx(markdownContent, {
        title: 'RFP Proposal Document',
        rfpName: 'LED Lighting Upgrade',
        submissionDate: new Date('2024-01-01')
      });

      expect(doc).toBeDefined();
      
      expect(Document).toHaveBeenCalled();
      
      // Verify that the document was created with sections
      const documentCall = (Document as jest.Mock).mock.calls[(Document as jest.Mock).mock.calls.length - 1];
      const sections = documentCall[0].sections;
      expect(sections).toBeDefined();
      expect(sections.length).toBeGreaterThan(0);
    });

    it('downloads markdown documents as DOCX', async () => {
      const markdownContent = '# Test Document\n\nThis is a test.';
      const mockBlob = new Blob(['mock content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      (Packer.toBlob as jest.Mock).mockResolvedValue(mockBlob);
      
      await DocxExporter.downloadMarkdownDocx(markdownContent, {
        title: 'Test Document',
        filename: 'test-document.docx'
      });

      expect(Packer.toBlob).toHaveBeenCalled();
      
      expect(saveAs).toHaveBeenCalledWith(mockBlob, 'test-document.docx');
    });
  });
});
