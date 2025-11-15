// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonLabel,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonButtons,
  useIonToast
} from '@ionic/react';
import { 
  trash, 
  refresh,
  close,
  documentText,
  imageOutline,
  fileTrayFull
} from 'ionicons/icons';
import { KnowledgeRetrievalService, KnowledgeEntry } from '../services/knowledgeRetrievalService';

interface FileKnowledgeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

const FileKnowledgeManager: React.FC<FileKnowledgeManagerProps> = ({
  isOpen,
  onClose,
  accountId
}) => {
  const [files, setFiles] = useState<KnowledgeEntry[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [present] = useIonToast();

  // Load files on mount and when modal opens
  useEffect(() => {
    if (isOpen && accountId) {
      loadFiles();
    }
  }, [isOpen, accountId]);

  // Filter files when search or file type changes
  useEffect(() => {
    let filtered = files;

    // Filter by file type
    if (selectedFileType) {
      filtered = filtered.filter(f => f.fileType === selectedFileType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.fileName?.toLowerCase().includes(query) ||
        f.content.toLowerCase().includes(query)
      );
    }

    setFilteredFiles(filtered);
  }, [files, searchQuery, selectedFileType]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const loadedFiles = await KnowledgeRetrievalService.getUploadedFiles(accountId, {
        limit: 100
      });
      setFiles(loadedFiles);
      console.log(`✅ Loaded ${loadedFiles.length} files`);
    } catch (error) {
      console.error('Error loading files:', error);
      present({
        message: 'Failed to load files',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileId: string, fileName?: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${fileName || 'this file'}?`
    );
    
    if (!confirmed) return;

    try {
      const result = await KnowledgeRetrievalService.deleteKnowledge(fileId, accountId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete');
      }
      
      // Remove from local state
      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      present({
        message: `Deleted ${fileName || 'file'}`,
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      present({
        message: 'Failed to delete file',
        duration: 3000,
        color: 'danger'
      });
    }
  };

  const handleRegenerate = async (fileId: string, fileName?: string) => {
    try {
      present({
        message: `Regenerating embedding for ${fileName || 'file'}...`,
        duration: 2000,
        color: 'primary'
      });

      const result = await KnowledgeRetrievalService.regenerateEmbedding(fileId, accountId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to regenerate');
      }
      
      present({
        message: `Embedding regenerated for ${fileName || 'file'}`,
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error regenerating embedding:', error);
      present({
        message: 'Failed to regenerate embedding',
        duration: 3000,
        color: 'danger'
      });
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadFiles();
    event.detail.complete();
  };

  const getFileIcon = (fileType?: string): string => {
    if (!fileType) return fileTrayFull;
    
    if (fileType.startsWith('image')) return imageOutline;
    if (fileType === 'pdf' || fileType.startsWith('text')) return documentText;
    return documentText; // Default to documentText instead of document
  };

  // Reserved for future use - format file sizes in KB/MB
  // const formatFileSize = (bytes?: number) => {
  //   if (!bytes) return 'Unknown size';
  //   
  //   const kb = bytes / 1024;
  //   if (kb < 1024) return `${kb.toFixed(1)} KB`;
  //   
  //   const mb = kb / 1024;
  //   return `${mb.toFixed(1)} MB`;
  // };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get unique file types for filtering
  const fileTypes = Array.from(new Set(files.map(f => f.fileType).filter(Boolean))) as string[];

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Knowledge Base Files</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchQuery}
            onIonInput={e => setSearchQuery(e.detail.value || '')}
            placeholder="Search files..."
            debounce={300}
          />
        </IonToolbar>
        {fileTypes.length > 0 && (
          <IonToolbar>
            <div style={{ padding: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              <IonChip
                color={selectedFileType === null ? 'primary' : 'medium'}
                onClick={() => setSelectedFileType(null)}
              >
                <IonLabel>All ({files.length})</IonLabel>
              </IonChip>
              {fileTypes.map(type => {
                const count = files.filter(f => f.fileType === type).length;
                return (
                  <IonChip
                    key={type}
                    color={selectedFileType === type ? 'primary' : 'medium'}
                    onClick={() => setSelectedFileType(type)}
                  >
                    <IonLabel>{type} ({count})</IonLabel>
                  </IonChip>
                );
              })}
            </div>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <IonIcon
              icon={fileTrayFull}
              style={{ fontSize: '64px', color: 'var(--ion-color-medium)' }}
            />
            <IonText color="medium">
              <p>
                {searchQuery || selectedFileType
                  ? 'No files match your filters'
                  : 'No files uploaded yet'}
              </p>
            </IonText>
          </div>
        ) : (
          <IonList>
            {filteredFiles.map(file => (
              <IonCard key={file.id}>
                <IonCardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={getFileIcon(file.fileType)} />
                      <IonCardTitle style={{ fontSize: '16px' }}>
                        {file.fileName || 'Unnamed File'}
                      </IonCardTitle>
                    </div>
                    <IonBadge color="medium">{file.fileType || 'unknown'}</IonBadge>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ marginBottom: '12px' }}>
                    <IonText color="medium" style={{ fontSize: '12px' }}>
                      <p style={{ margin: '4px 0' }}>
                        Uploaded: {formatDate(file.createdAt)}
                      </p>
                      {file.mimeType && (
                        <p style={{ margin: '4px 0' }}>MIME: {file.mimeType}</p>
                      )}
                    </IonText>
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>
                      <IonText>
                        <p style={{ 
                          margin: '0',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {file.content.substring(0, 200)}
                          {file.content.length > 200 ? '...' : ''}
                        </p>
                      </IonText>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <IonButton
                      size="small"
                      fill="outline"
                      color="danger"
                      onClick={() => handleDelete(file.id, file.fileName)}
                    >
                      <IonIcon slot="start" icon={trash} />
                      Delete
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => handleRegenerate(file.id, file.fileName)}
                    >
                      <IonIcon slot="start" icon={refresh} />
                      Re-embed
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonModal>
  );
};

export default FileKnowledgeManager;
