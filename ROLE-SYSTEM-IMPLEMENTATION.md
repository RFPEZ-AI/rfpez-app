# User Role System Implementation

## Overview

The RFPEZ.AI application now includes a comprehensive user role system that provides hierarchical access control with three roles in ascending order of access:

1. **User** (Level 1) - Basic user access
2. **Developer** (Level 2) - Extended access with development features  
3. **Administrator** (Level 3) - Full system management capabilities

## Database Changes

### User Profiles Table

Added a `role` column to the `user_profiles` table:

```sql
role TEXT DEFAULT 'user' CHECK (role IN ('user', 'developer', 'administrator'))
```

- New users default to 'user' role
- Database constraint ensures only valid roles
- Indexed for performance

### Migration Script

The `migration-add-roles.sql` script:
- Adds the role column safely
- Updates existing users to 'user' role
- Creates database functions for role management
- Updates RLS policies for administrator access

## Core Components

### 1. RoleService (`src/services/roleService.ts`)

Central service for role management:

```typescript
// Check role hierarchy
RoleService.hasRoleAccess(userRole, requiredRole)

// Get role information
RoleService.getRoleDisplayName(role)
RoleService.getRoleDescription(role)
RoleService.getRoleAccessLevel(role)

// Role validation
RoleService.isValidRole(role)
RoleService.isAdministrator(role)
RoleService.isDeveloperOrHigher(role)
```

### 2. Type Definitions

Enhanced TypeScript types in `src/types/database.ts`:

```typescript
export type UserRole = 'user' | 'developer' | 'administrator';

export interface UserProfile {
  // ... existing fields
  role: UserRole;
  // ... rest of interface
}
```

### 3. Database Service Updates

Added role management methods to `DatabaseService`:

```typescript
// Update user role (admin function)
static async updateUserRole(userId: string, role: UserRole): Promise<UserProfile | null>
```

### 4. Context Updates

Updated `SupabaseContext` to:
- Use proper UserProfile type with role
- Set default role for new users
- Handle role in fallback scenarios

## UI Components

### 1. AuthButtons Enhancement

The user menu now displays:
- User's current role
- Color-coded role badge
- Role display name

### 2. RoleManagement Component

Administrator-only component featuring:
- **Role Hierarchy Display**: Shows all roles with descriptions and access levels
- **User Management**: List all users with current roles
- **Role Assignment**: Dropdown to change user roles
- **Safety Features**: Prevents admin self-demotion
- **Real-time Updates**: Immediate UI updates after role changes

### 3. Agent Service Integration

Enhanced agent filtering with `getAgentsByUserRole()`:
- Maps existing `is_restricted` field to role requirements
- Restricted agents require developer+ role
- Foundation for future role-based agent access

## Access Control Features

### Current Implementation

1. **UI Display**: Role shown in user menu
2. **Role Validation**: Type-safe role checking
3. **Administrative Tools**: Role management for administrators
4. **Agent Filtering**: Role-based agent access (basic implementation)

### Security Features

1. **Database Constraints**: SQL-level role validation
2. **Row Level Security**: Administrator can view/modify all user profiles
3. **Type Safety**: TypeScript ensures role consistency
4. **Self-Protection**: Administrators cannot demote themselves

## Usage Examples

### For Administrators

1. **View Role Management**: Automatically shown in development mode
2. **Change User Roles**: Use dropdown in user list
3. **Monitor Access**: See role hierarchy and descriptions

### For Developers

Access to:
- Development debugging tools
- Extended agent features (when implemented)
- Advanced application features

### For Users

Standard access to:
- Core application features
- Basic agents
- Standard functionality

## Future Enhancements

### Planned Features

1. **Agent Role Requirements**: Add `minimum_role` column to agents table
2. **Feature Gating**: Role-based feature access throughout app
3. **Audit Logging**: Track role changes and access attempts
4. **Role-based UI**: Show/hide features based on user role
5. **API Access Control**: Role-based API endpoint restrictions

### Integration Points

1. **Agent System**: More granular agent access control
2. **File Management**: Role-based file access permissions
3. **Session Management**: Role-based session features
4. **Billing Integration**: Role-based subscription tiers

## Development Notes

### Adding New Roles

1. Update `UserRole` type in `types/database.ts`
2. Update database CHECK constraint
3. Add role handling in `RoleService`
4. Update UI components for new role

### Role-based Feature Gating

```typescript
// Example pattern for role-based features
{userProfile?.role && RoleService.isDeveloperOrHigher(userProfile.role) && (
  <DeveloperFeature />
)}
```

### Testing Roles

In development mode:
1. Sign in as any user
2. Administrator can access Role Management component
3. Change user roles through the UI
4. Test feature access with different roles

## File Summary

### New Files
- `src/services/roleService.ts` - Core role management logic
- `src/components/RoleManagement.tsx` - Admin role management UI
- `database/migration-add-roles.sql` - Database migration script

### Modified Files
- `database/schema.sql` - Added role column
- `src/types/database.ts` - Added UserRole type and updated UserProfile
- `src/context/SupabaseContext.tsx` - Role handling in user profile management
- `src/services/database.ts` - Added updateUserRole method
- `src/components/AuthButtons.tsx` - Role display in user menu
- `src/services/agentService.ts` - Basic role-based agent filtering
- `src/pages/Home.tsx` - Integration of role management component

The role system provides a solid foundation for hierarchical access control that can be extended as the application grows.
