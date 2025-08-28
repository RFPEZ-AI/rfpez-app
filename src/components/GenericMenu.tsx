import React, { useState } from 'react';
import { IonPopover, IonList, IonItem, IonLabel, IonIcon, IonButton, IonAlert } from '@ionic/react';
import { add, create, trash } from 'ionicons/icons';

interface GenericMenuProps<T> {
  items: T[];
  getLabel: (item: T) => string;
  onNew: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  showPopover: boolean;
  setShowPopover: (show: boolean) => void;
  title: string;
}

function GenericMenu<T extends { id: string | number }>({ items, getLabel, onNew, onEdit, onDelete, showPopover, setShowPopover, title }: GenericMenuProps<T>) {
  const [deleteItem, setDeleteItem] = useState<T | null>(null);

  return (
    <>
      <IonPopover isOpen={showPopover} onDidDismiss={() => setShowPopover(false)}>
        <IonList>
          <IonItem button onClick={() => { setShowPopover(false); onNew(); }}>
            <IonIcon icon={add} slot="start" />
            <IonLabel>New {title}</IonLabel>
          </IonItem>
          {items.map(item => (
            <IonItem key={item.id}>
              <IonLabel>{getLabel(item)}</IonLabel>
              <IonButton fill="clear" slot="end" onClick={() => { setShowPopover(false); onEdit(item); }}>
                <IonIcon icon={create} />
              </IonButton>
              <IonButton fill="clear" color="danger" slot="end" onClick={() => setDeleteItem(item)}>
                <IonIcon icon={trash} />
              </IonButton>
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
