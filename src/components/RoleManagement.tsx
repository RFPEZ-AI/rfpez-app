import React, { useState, useEffect } from 'react';
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonAlert,
  IonIcon,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonBadge
} from '@ionic/react';
import { personOutline, shieldCheckmarkOutline, constructOutline } from 'ionicons/icons';
import { useSupabase } from '../context/SupabaseContext';
import { RoleService } from '../services/roleService';
import { supabase } from '../supabaseClient';
import type { UserProfile, UserRole } from '../types/database';

interface RoleManagementProps {
  currentUserRole: UserRole;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ currentUserRole }) => {
  const { userProfile } = useSupabase();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');

  useEffect(() => {
    if (RoleService.isAdministrator(currentUserRole)) {
      loadUsers();
    }
  }, [currentUserRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setUsers(data as UserProfile[]);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (user: UserProfile, role: UserRole) => {
    if (user.id === userProfile?.id && role !== 'administrator') {
      // Prevent admin from demoting themselves
      return;
    }
    
    setSelectedUser(user);
    setNewRole(role);
    setShowConfirmAlert(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || !selectedUser.id) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return;
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, role: newRole }
            : user
        )
      );

      setShowConfirmAlert(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return shieldCheckmarkOutline;
      case 'developer':
        return constructOutline;
      default:
        return personOutline;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'administrator':
        return 'danger';
      case 'developer':
        return 'warning';
      default:
        return 'medium';
    }
  };

  if (!RoleService.isAdministrator(currentUserRole)) {
    return (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Access Denied</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          You need administrator privileges to manage user roles.
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>User Role Management</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard color="light">
                <IonCardHeader>
                  <IonCardTitle>Role Hierarchy</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {RoleService.getAllRoles().map((role) => (
                      <IonItem key={role}>
                        <IonIcon icon={getRoleIcon(role)} slot="start" />
                        <IonLabel>
                          <h3>{RoleService.getRoleDisplayName(role)}</h3>
                          <p>{RoleService.getRoleDescription(role)}</p>
                        </IonLabel>
                        <IonBadge color={getRoleColor(role)} slot="end">
                          Level {RoleService.getRoleAccessLevel(role)}
                        </IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            </IonCol>
            
            <IonCol size="12" sizeMd="6">
              <IonList>
                <IonListHeader>
                  <IonLabel>Users ({users.length})</IonLabel>
                  <IonButton 
                    fill="clear" 
                    size="small" 
                    onClick={loadUsers}
                    disabled={loading}
                  >
                    Refresh
                  </IonButton>
                </IonListHeader>
                
                {loading ? (
                  <IonItem>
                    <IonLabel>Loading users...</IonLabel>
                  </IonItem>
                ) : (
                  users.map((user) => (
                    <IonItem key={user.id}>
                      <IonIcon icon={getRoleIcon(user.role)} slot="start" />
                      <IonLabel>
                        <h3>{user.full_name || user.email}</h3>
                        <p>{user.email}</p>
                        {user.id === userProfile?.id && (
                          <IonNote color="primary">You</IonNote>
                        )}
                      </IonLabel>
                      <IonSelect
                        value={user.role}
                        placeholder="Select role"
                        onIonChange={(e) => handleRoleChange(user, e.detail.value)}
                        disabled={user.id === userProfile?.id && user.role === 'administrator'}
                      >
                        {RoleService.getAllRoles().map((role) => (
                          <IonSelectOption key={role} value={role}>
                            {RoleService.getRoleDisplayName(role)}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  ))
                )}
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => setShowConfirmAlert(false)}
          header="Confirm Role Change"
          message={`Are you sure you want to change ${selectedUser?.full_name || selectedUser?.email}'s role to ${RoleService.getRoleDisplayName(newRole)}?`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Confirm',
              handler: confirmRoleChange
            }
          ]}
        />
      </IonCardContent>
    </IonCard>
  );
};

export default RoleManagement;
