// Copyright Mark Skiba, 2025 All rights reserved

import { UserRole } from '../types/database';

export class RoleService {
  /**
   * Get the access level of a role (higher number = more access)
   */
  static getRoleAccessLevel(role: UserRole): number {
    switch (role) {
      case 'user':
        return 1;
      case 'developer':
        return 2;
      case 'administrator':
        return 3;
      default:
        return 0; // Unknown role
    }
  }

  /**
   * Check if a user role has access to a required role level
   */
  static hasRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
    return this.getRoleAccessLevel(userRole) >= this.getRoleAccessLevel(requiredRole);
  }

  /**
   * Check if a user role is administrator
   */
  static isAdministrator(role: UserRole): boolean {
    return role === 'administrator';
  }

  /**
   * Check if a user role is developer or higher
   */
  static isDeveloperOrHigher(role: UserRole): boolean {
    return this.hasRoleAccess(role, 'developer');
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case 'user':
        return 'User';
      case 'developer':
        return 'Developer';
      case 'administrator':
        return 'Administrator';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get role description
   */
  static getRoleDescription(role: UserRole): string {
    switch (role) {
      case 'user':
        return 'Basic user access with standard features';
      case 'developer':
        return 'Developer access with extended features and debugging tools';
      case 'administrator':
        return 'Full administrative access with system management capabilities';
      default:
        return 'Unknown role';
    }
  }

  /**
   * Get all available roles in ascending order
   */
  static getAllRoles(): UserRole[] {
    return ['user', 'developer', 'administrator'];
  }

  /**
   * Validate if a string is a valid role
   */
  static isValidRole(role: string): role is UserRole {
    return ['user', 'developer', 'administrator'].includes(role as UserRole);
  }
}
