import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, ROLE_PERMISSIONS } from '@company-workspace/data';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get permissions for user's role with inheritance
    const userPermissions = this.getUserPermissionsWithInheritance(user.role);

    // Check if user has all required permissions
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have the required permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Get user permissions with role inheritance
   * OWNER inherits all permissions
   * ADMIN inherits VIEWER permissions
   * VIEWER has base permissions
   */
  private getUserPermissionsWithInheritance(role: string): Permission[] {
    const permissions = new Set<Permission>();

    // Add role-specific permissions
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach((permission) => permissions.add(permission));

    return Array.from(permissions);
  }
}
