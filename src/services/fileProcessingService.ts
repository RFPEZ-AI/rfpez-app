// Copyright Mark Skiba, 2025 All rights reserved

// File processing service for knowledge base uploads
import { supabase } from '../supabaseClient';

export interface FileUploadOptions {
  accountId: string;
  userId: string;
  rfpId?: number;
  importanceScore?: number;
}

export interface ProcessedFile {
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSizeBytes: number;
  content: string; // Extracted text or base64 for images
  metadata: Record<string, unknown>;
}

export interface UploadResult {
  success: boolean;
  memoryId?: string;
  error?: string;
  fileName: string;
}

// Supported file types based on Claude 3.5 Sonnet capabilities
const SUPPORTED_MIME_TYPES = {
  // Images (sent as base64 to Claude)
  'image/jpeg': { category: 'image', maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/png': { category: 'image', maxSize: 5 * 1024 * 1024 },
  'image/gif': { category: 'image', maxSize: 5 * 1024 * 1024 },
  'image/webp': { category: 'image', maxSize: 5 * 1024 * 1024 },
  
  // Documents (text extracted, sent as content to Claude)
  'application/pdf': { category: 'pdf', maxSize: 10 * 1024 * 1024 }, // 10MB
  'text/plain': { category: 'text', maxSize: 5 * 1024 * 1024 },
  'text/markdown': { category: 'text', maxSize: 5 * 1024 * 1024 },
  'text/csv': { category: 'text', maxSize: 5 * 1024 * 1024 },
  
  // Office documents (text extraction required)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    category: 'document', 
    maxSize: 10 * 1024 * 1024 
  }, // DOCX
  'application/msword': { category: 'document', maxSize: 10 * 1024 * 1024 }, // DOC
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
    category: 'spreadsheet', 
    maxSize: 10 * 1024 * 1024 
  }, // XLSX
};

export const SUPPORTED_FILE_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.txt', '.md', '.csv', '.doc', '.docx', '.xlsx'
];

export const ACCEPT_STRING = Object.keys(SUPPORTED_MIME_TYPES).join(',');

class FileProcessingService {
  /**
   * Validate file against supported types and size limits
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const fileTypeInfo = SUPPORTED_MIME_TYPES[file.type as keyof typeof SUPPORTED_MIME_TYPES];
    
    if (!fileTypeInfo) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}. Supported types: PDF, images (JPEG, PNG, GIF, WebP), text files, Word documents, Excel spreadsheets.`
      };
    }
    
    if (file.size > fileTypeInfo.maxSize) {
      const maxSizeMB = (fileTypeInfo.maxSize / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size of ${maxSizeMB}MB for ${fileTypeInfo.category} files.`
      };
    }
    
    return { valid: true };
  }

  /**
   * Process file based on type - extract text or convert to base64
   */
  async processFile(file: File): Promise<ProcessedFile> {
    const fileTypeInfo = SUPPORTED_MIME_TYPES[file.type as keyof typeof SUPPORTED_MIME_TYPES];
    
    if (!fileTypeInfo) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    let content: string;
    const metadata: Record<string, unknown> = {
      originalFileName: file.name,
      uploadedAt: new Date().toISOString(),
      fileCategory: fileTypeInfo.category
    };

    // Process based on file type
    if (fileTypeInfo.category === 'image') {
      // Convert images to base64 for Claude API
      content = await this.fileToBase64(file);
      metadata.encoding = 'base64';
      metadata.isImage = true;
    } else if (fileTypeInfo.category === 'text') {
      // Read text files directly
      content = await this.fileToText(file);
      metadata.encoding = 'text';
    } else if (fileTypeInfo.category === 'pdf') {
      // Extract text from PDF (placeholder - requires PDF library)
      content = await this.extractPdfText(file);
      metadata.encoding = 'extracted_text';
    } else if (fileTypeInfo.category === 'document' || fileTypeInfo.category === 'spreadsheet') {
      // Extract text from Office documents (placeholder - requires document parsing library)
      content = await this.extractDocumentText(file);
      metadata.encoding = 'extracted_text';
    } else {
      throw new Error(`Unable to process file category: ${fileTypeInfo.category}`);
    }

    return {
      fileName: file.name,
      fileType: fileTypeInfo.category,
      mimeType: file.type,
      fileSizeBytes: file.size,
      content,
      metadata
    };
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Read text file content
   */
  private fileToText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Extract text from PDF file
   * TODO: Implement using pdf.js or similar library
   */
  private async extractPdfText(file: File): Promise<string> {
    // Placeholder implementation
    // In production, use pdf.js: https://mozilla.github.io/pdf.js/
    console.warn('PDF text extraction not yet implemented. File will be stored but content may be incomplete.');
    return `[PDF file: ${file.name} - Text extraction requires pdf.js library integration]`;
  }

  /**
   * Extract text from Office documents (Word, Excel)
   * Uses simple text extraction - for better results, consider adding specialized libraries
   */
  private async extractDocumentText(file: File): Promise<string> {
    try {
      // For Excel files (.xlsx, .xls), read as text and extract visible content
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        return await this.extractExcelText(file);
      }
      
      // For Word documents, try basic text extraction
      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        // Basic extraction - for better results, add 'mammoth' library
        const text = await this.fileToText(file);
        return text || `[Word document: ${file.name} - Basic text extraction]`;
      }
      
      // Fallback: try to read as text
      const text = await this.fileToText(file);
      return text || `[Document file: ${file.name}]`;
    } catch (error) {
      console.error('Error extracting document text:', error);
      return `[Document file: ${file.name} - Error during text extraction]`;
    }
  }

  /**
   * Extract text content from Excel files
   * Reads file as text and extracts cell values
   */
  private async extractExcelText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          // Excel files are ZIP archives containing XML files
          // Extract visible text content from the raw data
          // This is a simple approach - for full parsing, use 'xlsx' library
          
          // Remove XML tags and extract text between them
          const textContent = content
            .replace(/<[^>]*>/g, ' ')  // Remove XML tags
            .replace(/\s+/g, ' ')       // Normalize whitespace
            .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
            .trim();
          
          if (textContent.length > 100) {
            resolve(`Excel file: ${file.name}\n\nExtracted content:\n${textContent.substring(0, 5000)}`);
          } else {
            // If extraction failed, provide metadata
            resolve(`Excel file: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)}KB\nNote: For full Excel parsing, install 'xlsx' library`);
          }
        } catch (error) {
          console.error('Error parsing Excel content:', error);
          resolve(`Excel file: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)}KB\n[Text extraction encountered errors]`);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };
      
      // Read as text to extract content
      reader.readAsText(file);
    });
  }

  /**
   * Generate embedding for content asynchronously
   * Calls the generate-embedding edge function
```   */
  private async generateEmbeddingAsync(memoryId: string, content: string): Promise<void> {
    try {
      console.log('🔄 Generating embedding for memory:', memoryId);
      
      // Call edge function to generate embedding
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text: content }
      });

      if (error) {
        console.error('Error calling generate-embedding function:', error);
        return;
      }

      if (!data?.embedding) {
        console.error('No embedding in response from generate-embedding');
        return;
      }

      // Update the memory with the generated embedding
      const { error: updateError } = await supabase
        .from('account_memories')
        .update({ embedding: data.embedding })
        .eq('id', memoryId);

      if (updateError) {
        console.error('Error updating memory with embedding:', updateError);
        return;
      }

      console.log('✅ Embedding generated and stored for memory:', memoryId);
    } catch (error) {
      console.error('Exception in generateEmbeddingAsync:', error);
    }
  }

  /**
   * Upload processed file to knowledge base
   */
  async uploadToKnowledgeBase(
    processedFile: ProcessedFile,
    options: FileUploadOptions
  ): Promise<UploadResult> {
    try {
      const { accountId, userId, rfpId, importanceScore = 0.8 } = options;

      // Prepare metadata for storage
      const metadata = {
        ...processedFile.metadata,
        rfp_id: rfpId,
        uploadType: 'file',
        tags: [processedFile.fileType, 'uploaded_file']
      };

      // Insert into account_memories table
      const { data, error } = await supabase
        .from('account_memories')
        .insert({
          account_id: accountId,
          user_id: userId,
          memory_type: 'knowledge',
          content: processedFile.content,
          importance_score: importanceScore,
          file_name: processedFile.fileName,
          file_type: processedFile.fileType,
          file_size_bytes: processedFile.fileSizeBytes,
          mime_type: processedFile.mimeType,
          metadata: metadata,
          // Note: embedding vector will be generated by backend/edge function
          // search_vector is auto-generated from content
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing file in knowledge base:', error);
        return {
          success: false,
          error: error.message,
          fileName: processedFile.fileName
        };
      }

      console.log('✅ File stored in knowledge base:', {
        memoryId: data.id,
        fileName: processedFile.fileName,
        fileType: processedFile.fileType,
        size: processedFile.fileSizeBytes
      });

      // Generate embedding for the content asynchronously
      this.generateEmbeddingAsync(data.id, processedFile.content)
        .catch(error => {
          console.error('Failed to generate embedding for file:', processedFile.fileName, error);
        });

      return {
        success: true,
        memoryId: data.id,
        fileName: processedFile.fileName
      };
    } catch (error) {
      console.error('Unexpected error during file upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: processedFile.fileName
      };
    }
  }

  /**
   * Complete upload workflow - validate, process, and store
   */
  async uploadFile(file: File, options: FileUploadOptions): Promise<UploadResult> {
    // Step 1: Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        fileName: file.name
      };
    }

    // Step 2: Process file
    let processedFile: ProcessedFile;
    try {
      processedFile = await this.processFile(file);
    } catch (error) {
      return {
        success: false,
        error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fileName: file.name
      };
    }

    // Step 3: Upload to knowledge base
    return this.uploadToKnowledgeBase(processedFile, options);
  }

  /**
   * Get list of uploaded files for an account
   */
  async getUploadedFiles(accountId: string, limit = 50): Promise<{
    success: boolean;
    files?: Array<{
      id: string;
      fileName: string;
      fileType: string;
      fileSizeBytes: number;
      createdAt: string;
      importanceScore: number;
    }>;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('account_memories')
        .select('id, file_name, file_type, file_size_bytes, created_at, importance_score')
        .eq('account_id', accountId)
        .eq('memory_type', 'knowledge')
        .not('file_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        files: data.map((item: { id: string; file_name: string | null; file_type: string | null; file_size_bytes: number | null; created_at: string | null; importance_score: number | null }) => ({
          id: item.id,
          fileName: item.file_name || 'Unknown',
          fileType: item.file_type || 'unknown',
          fileSizeBytes: item.file_size_bytes || 0,
          createdAt: item.created_at || new Date().toISOString(),
          importanceScore: item.importance_score || 0.5
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete an uploaded file from knowledge base
   */
  async deleteFile(fileId: string, accountId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('account_memories')
        .delete()
        .eq('id', fileId)
        .eq('account_id', accountId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const fileProcessingService = new FileProcessingService();
export default fileProcessingService;
