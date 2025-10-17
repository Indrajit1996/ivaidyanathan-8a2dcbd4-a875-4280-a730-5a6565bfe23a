import { Injectable } from '@nestjs/common';
import { Permission, ROLE_PERMISSIONS } from '../enums/permission.enum';
import { UserRole } from '../user.entity';

@Injectable()
export class RbacService {
  /**
   * Check if a role has a specific permission
   */
  hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }

  /**
   * Check if a role has all specified permissions
   */
  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.every((permission) =>
      rolePermissions.includes(permission)
    );
  }

  /**
   * Check if a role has any of the specified permissions
   */
  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.some((permission) =>
      rolePermissions.includes(permission)
    );
  }

  /**
   * Get all permissions for a role with inheritance
   * OWNER > ADMIN > VIEWER
   */
  getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if roleA can manage roleB based on hierarchy
   * OWNER can manage ADMIN and VIEWER
   * ADMIN can manage VIEWER
   * VIEWER cannot manage anyone
   */
  canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.OWNER]: 3,
      [UserRole.ADMIN]: 2,
      [UserRole.VIEWER]: 1,
    };

    return roleHierarchy[managerRole] > roleHierarchy[targetRole];
  }

  /**
   * Get the role hierarchy level
   */
  getRoleLevel(role: UserRole): number {
    const roleHierarchy = {
      [UserRole.OWNER]: 3,
      [UserRole.ADMIN]: 2,
      [UserRole.VIEWER]: 1,
    };

    return roleHierarchy[role] || 0;
  }

  /**
   * Check if a user can perform an action on a resource
   */
  canAccessResource(
    userRole: UserRole,
    userId: string,
    resourceOwnerId: string,
    requiredPermission: Permission
  ): boolean {
    // Check if user has the permission
    if (!this.hasPermission(userRole, requiredPermission)) {
      return false;
    }

    // OWNER and ADMIN can access all resources in their org
    if (userRole === UserRole.OWNER || userRole === UserRole.ADMIN) {
      return true;
    }

    // VIEWER can only access their own resources
    return userId === resourceOwnerId;
  }
}
