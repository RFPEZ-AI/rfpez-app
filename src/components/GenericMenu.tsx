// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonPopover, IonList, IonItem, IonLabel, IonIcon, IonButton, IonAlert } from '@ionic/react';
import { add, create, trash, eye, share, radioButtonOn, radioButtonOff } from 'ionicons/icons';

interface GenericMenuProps<T> {
  items: T[];
  getLabel: (item: T) => string;
  onNew: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onPreview?: (item: T) => void; // Optional preview handler
  onShare?: (item: T) => void; // Optional share handler
  onSetCurrent?: (item: T | null) => void; // Optional set as current handler
  showPopover: boolean;
  setShowPopover: (show: boolean) => void;
  title: string;
  currentItemId?: string | number; // ID of currently selected item
}

function GenericMenu<T extends { id: string | number }>({ 
  items, 
  getLabel, 
  onNew, 
  onEdit, 
  onDelete, 
  onPreview,
  onShare,
  onSetCurrent,
  showPopover, 
  setShowPopover, 
  title,
  currentItemId
}: GenericMenuProps<T>) {
  const [deleteItem, setDeleteItem] = useState<T | null>(null);

  return (
    <>
      <IonPopover isOpen={showPopover} onDidDismiss={() => setShowPopover(false)} style={{ '--width': 'min(90vw, 700px)', '--min-width': '500px' }}>
        <IonList>
          <IonItem button onClick={() => { setShowPopover(false); onNew(); }} data-testid={`new-${title.toLowerCase()}-button`}>
            <IonIcon icon={add} slot="start" />
            <IonLabel>New {title}</IonLabel>
          </IonItem>
          {items.map(item => (
            <IonItem key={item.id} style={{ '--padding-start': '16px', '--padding-end': '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
                <IonLabel style={{ flex: '1 1 auto', minWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getLabel(item)}</IonLabel>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                {onSetCurrent && (
                  <IonButton 
                    fill="clear" 
                    size="small" 
                    color={currentItemId === item.id ? "primary" : "medium"}
                    onClick={() => { setShowPopover(false); onSetCurrent(item); }}
                    style={{ '--padding-start': '4px', '--padding-end': '4px', margin: 0 }}
                    data-testid={`set-current-${title.toLowerCase()}-${item.id}`}
                  >
                    <IonIcon icon={currentItemId === item.id ? radioButtonOn : radioButtonOff} />
                  </IonButton>
                )}
                {onPreview && (
                  <IonButton 
                    fill="clear" 
                    size="small" 
                    onClick={() => { setShowPopover(false); onPreview(item); }}
                    style={{ '--padding-start': '4px', '--padding-end': '4px', margin: 0 }}
                  >
                    <IonIcon icon={eye} />
                  </IonButton>
                )}
                {onShare && (
                  <IonButton 
                    fill="clear" 
                    size="small" 
                    onClick={() => { setShowPopover(false); onShare(item); }}
                    style={{ '--padding-start': '4px', '--padding-end': '4px', margin: 0 }}
                  >
                    <IonIcon icon={share} />
                  </IonButton>
                )}
                <IonButton 
                  fill="clear" 
                  size="small" 
                  onClick={() => { setShowPopover(false); onEdit(item); }}
                  style={{ '--padding-start': '4px', '--padding-end': '4px', margin: 0 }}
                >
                  <IonIcon icon={create} />
                </IonButton>
                <IonButton 
                  fill="clear" 
                  color="danger" 
                  size="small" 
                  onClick={() => setDeleteItem(item)}
                  style={{ '--padding-start': '4px', '--padding-end': '4px', margin: 0 }}
                >
                  <IonIcon icon={trash} />
                </IonButton>
                </div>
              </div>
            </IonItem>
          ))}
        </IonList>
      </IonPopover>
      <IonAlert
        isOpen={!!deleteItem}
        header={`Delete ${title}?`}
        message={`Are you sure you want to delete '${deleteItem ? getLabel(deleteItem) : ''}'?`}
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setDeleteItem(null) },
          { text: 'Delete', role: 'destructive', handler: () => { if (deleteItem) onDelete(deleteItem); setDeleteItem(null); } }
        ]}
        onDidDismiss={() => setDeleteItem(null)}
      />
    </>
  );
}

export default GenericMenu;
