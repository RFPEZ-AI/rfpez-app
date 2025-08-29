import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import type { FormSpec } from '../types/rfp';

interface DocxExportOptions {
  title?: string;
  filename?: string;
  companyName?: string;
  rfpName?: string;
  submissionDate?: Date;
  includeHeaders?: boolean;
  includeFooters?: boolean;
}

export class DocxExporter {
  /**
   * Builds a .docx document from form response data
   */
  static buildBidDocx(
    formSpec: FormSpec,
    responseData: Record<string, any>,
    options: DocxExportOptions = {}
  ): Document {
    const {
      title = 'Bid Response',
      companyName = '',
      rfpName = '',
      submissionDate = new Date(),
      includeHeaders = true
    } = options;

    const children: (Paragraph | Table)[] = [];

    // Document Header
    if (includeHeaders) {
      children.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      if (rfpName) {
        children.push(
          new Paragraph({
            text: `RFP: ${rfpName}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 }
          })
        );
      }

      if (companyName) {
        children.push(
          new Paragraph({
            text: `Submitted by: ${companyName}`,
            spacing: { after: 200 }
          })
        );
      }

      children.push(
        new Paragraph({
          text: `Date: ${submissionDate.toLocaleDateString()}`,
          spacing: { after: 400 }
        })
      );
    }

    // Build content sections from the form schema and response data
    const sections = this.buildContentSections(formSpec.schema, responseData);
    
    sections.forEach(section => {
      // Section title
      if (section.title) {
        children.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 }
          })
        );
      }

      // Section paragraphs
      section.paragraphs.forEach(paragraph => {
        children.push(
          new Paragraph({
            children: [new TextRun(paragraph)],
            spacing: { after: 150 }
          })
        );
      });

      // Section tables
      section.tables.forEach(table => {
        children.push(this.createTable(table));
      });
    });

    return new Document({
      sections: [
        {
          properties: {},
          children
        }
      ]
    });
  }

  /**
   * Downloads the document as a .docx file
   */
  static async downloadBidDocx(
    formSpec: FormSpec,
    responseData: Record<string, any>,
    options: DocxExportOptions = {}
  ): Promise<void> {
    // Generate filename from form title if not provided
    const { filename = this.sanitizeFilename(formSpec.schema.title || 'bid-response') + '.docx' } = options;
    
    const doc = this.buildBidDocx(formSpec, responseData, options);
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
  }

  /**
   * Sanitizes a filename by removing/replacing invalid characters
   */
  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[\/\\:*?"<>|]/g, '_')  // Replace invalid chars with underscore
      .replace(/\s+/g, '_')           // Replace spaces with underscore
      .replace(/_+/g, '_')            // Replace multiple underscores with single
      .replace(/^_|_$/g, '');         // Remove leading/trailing underscores
  }

  /**
   * Builds hierarchical content sections from schema and response data
   */
  private static buildContentSections(
    schema: Record<string, any>,
    responseData: Record<string, any>
  ): DocumentSection[] {
    const sections: DocumentSection[] = [];

    // Main response section
    const mainSection: DocumentSection = {
      title: schema.title || 'Response Details',
      paragraphs: [],
      tables: []
    };

    // Create paragraphs for each field instead of a table
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, fieldSchema]: [string, any]) => {
        const value = responseData[key];
        const label = fieldSchema.title || this.formatFieldName(key);
        
        if (value !== undefined && value !== null && value !== '') {
          const formattedValue = this.formatFieldValue(value, fieldSchema);
          mainSection.paragraphs.push(`${label}: ${formattedValue}`);
        }
      });
    }

    sections.push(mainSection);

    // Add detailed sections for complex fields (arrays, objects)
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, fieldSchema]: [string, any]) => {
        const value = responseData[key];
        
        if (fieldSchema.type === 'array' && Array.isArray(value) && value.length > 0) {
          sections.push(this.buildArraySection(key, fieldSchema, value));
        } else if (fieldSchema.type === 'object' && value && typeof value === 'object') {
          sections.push(this.buildObjectSection(key, fieldSchema, value));
        }
      });
    }

    return sections;
  }

  /**
   * Builds a section for array fields
   */
  private static buildArraySection(
    key: string,
    fieldSchema: any,
    value: any[]
  ): DocumentSection {
    const title = fieldSchema.title || this.formatFieldName(key);
    
    const section: DocumentSection = {
      title,
      paragraphs: [],
      tables: []
    };

    if (fieldSchema.items?.enum) {
      // Simple enum array - show as bullet list
      section.paragraphs.push(value.join(', '));
    } else {
      // Complex array - show as numbered list
      value.forEach((item, index) => {
        if (typeof item === 'string') {
          section.paragraphs.push(`${index + 1}. ${item}`);
        } else {
          section.paragraphs.push(`${index + 1}. ${JSON.stringify(item)}`);
        }
      });
    }

    return section;
  }

  /**
   * Builds a section for object fields
   */
  private static buildObjectSection(
    key: string,
    fieldSchema: any,
    value: Record<string, any>
  ): DocumentSection {
    const title = fieldSchema.title || this.formatFieldName(key);
    
    const section: DocumentSection = {
      title,
      paragraphs: [],
      tables: []
    };

    // Create a table for object properties
    const objectTable: DocumentTable = {
      headers: ['Property', 'Value'],
      rows: []
    };

    Object.entries(value).forEach(([propKey, propValue]) => {
      if (propValue !== undefined && propValue !== null && propValue !== '') {
        const propSchema = fieldSchema.properties?.[propKey] || {};
        const label = propSchema.title || this.formatFieldName(propKey);
        const formattedValue = this.formatFieldValue(propValue, propSchema);
        objectTable.rows.push([label, formattedValue]);
      }
    });

    if (objectTable.rows.length > 0) {
      section.tables.push(objectTable);
    }

    return section;
  }

  /**
   * Creates a Word table from table data
   */
  private static createTable(tableData: DocumentTable): Table {
    const rows = [
      // Header row
      new TableRow({
        children: tableData.headers.map(header => 
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: header, bold: true })],
                alignment: AlignmentType.CENTER
              })
            ],
            width: { size: 100 / tableData.headers.length, type: WidthType.PERCENTAGE }
          })
        )
      }),
      // Data rows
      ...tableData.rows.map(row => 
        new TableRow({
          children: row.map(cell => 
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun(String(cell))],
                  spacing: { before: 100, after: 100 }
                })
              ],
              width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
            })
          )
        })
      )
    ];

    return new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: {
        top: 200,
        bottom: 200,
        left: 100,
        right: 100
      }
    });
  }

  /**
   * Formats field values for display
   */
  private static formatFieldValue(value: any, schema: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    if (schema.format === 'date' && typeof value === 'string') {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }

    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.title?.toLowerCase().includes('rate') || schema.title?.toLowerCase().includes('price')) {
        return `$${value.toFixed(2)}`;
      }
      return value.toString();
    }

    return String(value);
  }

  /**
   * Formats field names for display
   */
  private static formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/([a-z])([A-Z])/g, '$1 $2'); // Handle camelCase
  }
}

// Helper interfaces
interface DocumentSection {
  title?: string;
  paragraphs: string[];
  tables: DocumentTable[];
}

interface DocumentTable {
  headers: string[];
  rows: string[][];
}

// Export utility function for easy use
export const downloadBidDocx = DocxExporter.downloadBidDocx.bind(DocxExporter);
export const buildBidDocx = DocxExporter.buildBidDocx.bind(DocxExporter);
