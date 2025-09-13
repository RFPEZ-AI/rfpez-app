// Copyright Mark Skiba, 2025 All rights reserved

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

interface JsonSchema {
  title?: string;
  properties?: { [key: string]: FieldSchema };
}

interface FieldSchema {
  type?: string;
  title?: string;
  description?: string;
  items?: { enum?: unknown[] };
  properties?: { [key: string]: FieldSchema };
  format?: string;
}

interface DocumentSection {
  title?: string;
  paragraphs: string[];
  tables: DocumentTable[];
}

interface DocumentTable {
  headers: string[];
  rows: string[][];
}

export class DocxExporter {
  static buildBidDocx(
    formSpec: FormSpec,
    responseData: Record<string, unknown>,
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
        const sections = DocxExporter.buildContentSections(formSpec.schema, responseData);
        sections.forEach((section: DocumentSection) => {
          if (section.title) {
            children.push(
              new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 }
              })
            );
          }
          section.paragraphs.forEach((paragraph: string) => {
            children.push(
              new Paragraph({
                children: [new TextRun(paragraph)],
                spacing: { after: 150 }
              })
            );
          });
          section.tables.forEach((table: DocumentTable) => {
            children.push(DocxExporter.createTable(table));
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

      static async downloadBidDocx(
        formSpec: FormSpec,
        responseData: Record<string, unknown>,
        options: DocxExportOptions = {}
      ): Promise<void> {
        const { filename = DocxExporter.sanitizeFilename(formSpec.schema.title || 'bid-response') + '.docx' } = options;
        const doc = DocxExporter.buildBidDocx(formSpec, responseData, options);
        const blob = await Packer.toBlob(doc);
        saveAs(blob, filename);
      }

      private static sanitizeFilename(filename: string): string {
        return filename
          .replace(/[\\/:*?"<>|]/g, '_')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
      }

      private static buildContentSections(
        schema: JsonSchema,
        responseData: Record<string, unknown>
      ): DocumentSection[] {
        const sections: DocumentSection[] = [];
        
        if (schema.properties) {
          // First, process all object-type properties as separate sections
          Object.entries(schema.properties).forEach(([key, fieldSchema]) => {
            if (fieldSchema.type === 'object' && fieldSchema.properties) {
              // Create a section for this object group
              const objectSection = DocxExporter.buildObjectSchemaSection(key, fieldSchema, responseData[key] as Record<string, unknown>);
              sections.push(objectSection);
            }
          });
          
          // Then, create a main section for any remaining non-object properties
          const nonObjectProperties = Object.entries(schema.properties).filter(([key, fieldSchema]) => 
            fieldSchema.type !== 'object'
          );
          
          if (nonObjectProperties.length > 0) {
            const mainSection: DocumentSection = {
              title: schema.title || 'Response Details',
              paragraphs: [],
              tables: []
            };
            
            nonObjectProperties.forEach(([key, fieldSchema]) => {
              const value = responseData[key];
              const label = fieldSchema.title || DocxExporter.formatFieldName(key);
              
              if (value !== undefined && value !== null && value !== '') {
                // If we have actual response data, show it
                const formattedValue = DocxExporter.formatFieldValue(value, fieldSchema);
                mainSection.paragraphs.push(`${label}: ${formattedValue}`);
              } else {
                // If no response data, show the field as a blank form field
                const fieldDescription = fieldSchema.description ? ` (${fieldSchema.description})` : '';
                mainSection.paragraphs.push(`${label}${fieldDescription}: ___________________________`);
              }
            });
            
            sections.push(mainSection);
          }
          
          // Finally, handle arrays (existing logic)
          Object.entries(schema.properties).forEach(([key, fieldSchema]) => {
            const value = responseData[key];
            if (fieldSchema.type === 'array' && Array.isArray(value) && value.length > 0) {
              sections.push(DocxExporter.buildArraySection(key, fieldSchema, value));
            }
          });
        }
        
        return sections;
      }

      private static buildObjectSchemaSection(
        key: string,
        fieldSchema: FieldSchema,
        responseData?: Record<string, unknown>
      ): DocumentSection {
        const title = fieldSchema.title || DocxExporter.formatFieldName(key);
        const section: DocumentSection = {
          title,
          paragraphs: [],
          tables: []
        };
        
        if (fieldSchema.properties) {
          Object.entries(fieldSchema.properties).forEach(([propKey, propSchema]) => {
            const value = responseData?.[propKey];
            const label = propSchema.title || DocxExporter.formatFieldName(propKey);
            
            if (value !== undefined && value !== null && value !== '') {
              // If we have actual response data, show it
              const formattedValue = DocxExporter.formatFieldValue(value, propSchema);
              section.paragraphs.push(`${label}: ${formattedValue}`);
            } else {
              // If no response data, show the field as a blank form field
              const fieldDescription = propSchema.description ? ` (${propSchema.description})` : '';
              section.paragraphs.push(`${label}${fieldDescription}: ___________________________`);
            }
          });
        }
        
        return section;
      }

      private static buildArraySection(
        key: string,
        fieldSchema: FieldSchema,
        value: unknown[]
      ): DocumentSection {
        const title = fieldSchema.title || DocxExporter.formatFieldName(key);
        const section: DocumentSection = {
          title,
          paragraphs: [],
          tables: []
        };
        if (fieldSchema.items?.enum) {
          section.paragraphs.push(value.join(', '));
        } else {
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

      private static buildObjectSection(
        key: string,
        fieldSchema: FieldSchema,
        value: Record<string, unknown>
      ): DocumentSection {
        const title = fieldSchema.title || DocxExporter.formatFieldName(key);
        const section: DocumentSection = {
          title,
          paragraphs: [],
          tables: []
        };
        const objectTable: DocumentTable = {
          headers: ['Property', 'Value'],
          rows: []
        };
        Object.entries(value).forEach(([propKey, propValue]) => {
          if (propValue !== undefined && propValue !== null && propValue !== '') {
            const propSchema = (fieldSchema.properties?.[propKey] as FieldSchema) || {};
            const label = propSchema.title || DocxExporter.formatFieldName(propKey);
            const formattedValue = DocxExporter.formatFieldValue(propValue, propSchema);
            objectTable.rows.push([label, formattedValue]);
          }
        });
        if (objectTable.rows.length > 0) {
          section.tables.push(objectTable);
        }
        return section;
      }

      private static createTable(tableData: DocumentTable): Table {
        const rows = [
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

      private static formatFieldValue(value: unknown, schema: FieldSchema): string {
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

      private static formatFieldName(fieldName: string): string {
        return fieldName
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .replace(/([a-z])([A-Z])/g, '$1 $2');
      }
    }

    export const downloadBidDocx = DocxExporter.downloadBidDocx.bind(DocxExporter);
    export const buildBidDocx = DocxExporter.buildBidDocx.bind(DocxExporter);

