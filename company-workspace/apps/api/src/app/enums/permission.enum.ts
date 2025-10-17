export enum Permission {
  // Task permissions
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_READ_ALL = 'task:read:all', // Can read all tasks in org
  TASK_READ_OWN = 'task:read:own', // Can only read own tasks
  TASK_UPDATE = 'task:update',
  TASK_UPDATE_ALL = 'task:update:all',
  TASK_UPDATE_OWN = 'task:update:own',
  TASK_DELETE = 'task:delete',
  TASK_DELETE_ALL = 'task:delete:all',
  TASK_DELETE_OWN = 'task:delete:own',

  // User permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Organization permissions
  ORG_MANAGE = 'org:manage',
  ORG_READ = 'org:read',

  // Audit log permissions
  AUDIT_LOG_READ = 'audit:read',
}

// Role-based permission mapping with inheritance
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    // Owner has ALL permissions
    Permission.TASK_CREATE,
    Permission.TASK_READ_ALL,
    Permission.TASK_READ_OWN,
    Permission.TASK_UPDATE_ALL,
    Permission.TASK_UPDATE_OWN,
    Permission.TASK_DELETE_ALL,
    Permission.TASK_DELETE_OWN,
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.ORG_MANAGE,
    Permission.ORG_READ,
    Permission.AUDIT_LOG_READ,
  ],
  ADMIN: [
    // Admin can manage tasks and users, but not org settings
    Permission.TASK_CREATE,
    Permission.TASK_READ_ALL,
    Permission.TASK_READ_OWN,
    Permission.TASK_UPDATE_ALL,
    Permission.TASK_UPDATE_OWN,
    Permission.TASK_DELETE_ALL,
    Permission.TASK_DELETE_OWN,
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.ORG_READ,
    Permission.AUDIT_LOG_READ,
  ],
  VIEWER: [
    // Viewer can only view and manage their own tasks
    Permission.TASK_CREATE,
    Permission.TASK_READ_OWN,
    Permission.TASK_UPDATE_OWN,
    Permission.TASK_DELETE_OWN,
    Permission.ORG_READ,
  ],
};
