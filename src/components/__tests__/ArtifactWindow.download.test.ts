// Copyright Mark Skiba, 2025 All rights reserved

import { DocxExporter } from '../../utils/docxExporter';
import type { FormSpec } from '../../types/rfp';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

// Mock docx
jest.mock('docx', () => ({
  Document: jest.fn().mockImplementation((options) => ({
    sections: options.sections
  })),
  Paragraph: jest.fn(),
  TextRun: jest.fn(),
  Table: jest.fn(),
  TableRow: jest.fn(),
  TableCell: jest.fn(),
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
    LEFT: 'LEFT'
  },
  WidthType: {
    PERCENTAGE: 'PERCENTAGE'
  }
}));

describe('ArtifactWindow Download Integration', () => {
  const mockBuyerQuestionnaireArtifact = {
    id: 'test-form-1',
    name: 'Buyer Questionnaire',
    type: 'form' as const,
    size: '2KB',
    content: JSON.stringify({
      title: 'Buyer Requirements Questionnaire',
      description: 'Please provide details about your project requirements',
      schema: {
        type: 'object',
        title: 'Buyer Requirements Questionnaire',
        required: ['projectName', 'budget'],
        properties: {
          projectName: {
            type: 'string',
            title: 'Project Name',
            description: 'What is the name of your project?'
          },
          budget: {
            type: 'number',
            title: 'Budget (USD)',
            minimum: 1000,
            description: 'What is your approximate budget?'
          },
          timeline: {
            type: 'string',
            title: 'Timeline',
            enum: ['1-3 months', '3-6 months', '6-12 months', '12+ months'],
            description: 'What is your expected timeline?'
          },
          requirements: {
            type: 'string',
            title: 'Detailed Requirements',
            description: 'Please describe your detailed requirements'
          }
        }
      },
      uiSchema: {
        requirements: {
          'ui:widget': 'textarea',
          'ui:options': { rows: 4 }
        }
      },
      formData: {
        projectName: 'LED Bulb Procurement',
        budget: 50000,
        timeline: '3-6 months',
        requirements: 'We need energy-efficient LED bulbs for our office building'
      }
    })
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should download buyer questionnaire form as DOCX', async () => {
    const { saveAs } = require('file-saver');
    const { Packer } = require('docx');
    
    // Set up the mock before calling the function
    const mockBlob = new Blob(['mock docx content'], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    Packer.toBlob.mockResolvedValue(mockBlob);
    
    // Parse the artifact content
    const formData = JSON.parse(mockBuyerQuestionnaireArtifact.content);
    
    // Convert to FormSpec format expected by DocxExporter
    const formSpec: FormSpec = {
      version: 'rfpez-form@1',
      schema: formData.schema,
      uiSchema: formData.uiSchema || {},
      defaults: formData.formData || {}
    };
    
    // Use the submitted form data as response data
    const responseData = formData.formData || {};
    
    // Set up export options
    const exportOptions = {
      title: formData.title || mockBuyerQuestionnaireArtifact.name || 'Form Response',
      filename: `${mockBuyerQuestionnaireArtifact.name || 'form-response'}.docx`,
      companyName: responseData.companyName || 'Your Company',
      rfpName: 'Test RFP Response',
      submissionDate: new Date(),
      includeHeaders: true
    };
    
    // Download as DOCX
    await DocxExporter.downloadBidDocx(formSpec, responseData, exportOptions);
    
    // Verify that the document was generated and downloaded
    expect(Packer.toBlob).toHaveBeenCalled();
    expect(saveAs).toHaveBeenCalledWith(
      mockBlob,
      'Buyer Questionnaire.docx'
    );
  });

  it('should handle forms with complex data types', async () => {
    const complexFormArtifact = {
      ...mockBuyerQuestionnaireArtifact,
      content: JSON.stringify({
        title: 'Complex Requirements Form',
        schema: {
          type: 'object',
          properties: {
            textField: { type: 'string', title: 'Text Field' },
            numberField: { type: 'number', title: 'Number Field' },
            arrayField: { 
              type: 'array', 
              title: 'Array Field',
              items: { type: 'string' }
            },
            objectField: {
              type: 'object',
              title: 'Object Field',
              properties: {
                subField1: { type: 'string', title: 'Sub Field 1' },
                subField2: { type: 'number', title: 'Sub Field 2' }
              }
            }
          }
        },
        formData: {
          textField: 'Sample text',
          numberField: 42,
          arrayField: ['Option 1', 'Option 2', 'Option 3'],
          objectField: {
            subField1: 'Nested text',
            subField2: 99
          }
        }
      })
    };

    const { saveAs } = require('file-saver');
    const { Packer } = require('docx');
    
    // Set up the mock before calling the function
    const mockBlob = new Blob(['mock complex docx content'], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    Packer.toBlob.mockResolvedValue(mockBlob);
    
    const formData = JSON.parse(complexFormArtifact.content);
    const formSpec: FormSpec = {
      version: 'rfpez-form@1',
      schema: formData.schema,
      uiSchema: {},
      defaults: formData.formData || {}
    };
    
    const responseData = formData.formData || {};
    const exportOptions = {
      title: formData.title,
      filename: `${complexFormArtifact.name}.docx`,
      companyName: 'Test Company',
      rfpName: 'Complex RFP',
      submissionDate: new Date()
    };
    
    await DocxExporter.downloadBidDocx(formSpec, responseData, exportOptions);
    
    expect(Packer.toBlob).toHaveBeenCalled();
    expect(saveAs).toHaveBeenCalledWith(mockBlob, 'Buyer Questionnaire.docx');
  });

  it('should handle empty or missing form data gracefully', async () => {
    const emptyFormArtifact = {
      ...mockBuyerQuestionnaireArtifact,
      content: JSON.stringify({
        title: 'Empty Form',
        schema: {
          type: 'object',
          properties: {
            field1: { type: 'string', title: 'Field 1' }
          }
        },
        formData: {}
      })
    };

    const { saveAs } = require('file-saver');
    const { Packer } = require('docx');
    
    // Set up the mock before calling the function
    const mockBlob = new Blob(['mock empty docx content'], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    Packer.toBlob.mockResolvedValue(mockBlob);
    
    const formData = JSON.parse(emptyFormArtifact.content);
    const formSpec: FormSpec = {
      version: 'rfpez-form@1',
      schema: formData.schema,
      uiSchema: {},
      defaults: {}
    };
    
    await DocxExporter.downloadBidDocx(formSpec, {}, {
      title: 'Empty Form Test',
      filename: 'empty-form.docx'
    });
    
    expect(Packer.toBlob).toHaveBeenCalled();
    expect(saveAs).toHaveBeenCalledWith(
      mockBlob,
      'empty-form.docx'
    );
  });
});