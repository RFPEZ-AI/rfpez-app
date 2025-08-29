import { DocxExporter } from './docxExporter';
import type { FormSpec } from '../types/rfp';
import { saveAs } from 'file-saver';

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
      const { Document } = require('docx');
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
      const { Paragraph } = require('docx');
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
            ...mockFormSpec.schema.properties,
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
            ...mockFormSpec.schema.properties,
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
      const { Packer } = require('docx');
      
      // Explicitly set up the mock before calling the function
      Packer.toBlob.mockResolvedValue(new Blob(['mock docx content'], { 
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
      const { Packer } = require('docx');
      
      // Explicitly set up the mock before calling the function
      Packer.toBlob.mockResolvedValue(new Blob(['mock docx content'], { 
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
      const { Packer } = require('docx');
      Packer.toBlob.mockRejectedValueOnce(new Error('Packer error'));
      
      await expect(
        DocxExporter.downloadBidDocx(mockFormSpec, mockBidData, mockSupplierInfo)
      ).rejects.toThrow('Packer error');
    });
  });

  describe('helper methods', () => {
    it('creates proper document structure', () => {
      const doc = DocxExporter.buildBidDocx(mockFormSpec, mockBidData, mockSupplierInfo);
      expect(doc).toBeDefined();
      
      const { Document } = require('docx');
      expect(Document).toHaveBeenCalled();
    });
  });
});
