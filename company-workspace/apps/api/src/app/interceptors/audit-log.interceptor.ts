import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../services/audit-log.service';
import { AuditAction } from '../entities/audit-log.entity';

/**
 * Interceptor to automatically log actions to the audit log
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip if no user (unauthenticated requests)
    if (!user) {
      return next.handle();
    }

    const method = request.method;
    const path = request.route?.path || request.url;
    const action = this.getActionFromRequest(method, path);

    // Skip if action cannot be determined
    if (!action) {
      return next.handle();
    }

    const resource = this.getResourceFromPath(path);
    const resourceId = request.params?.id || request.params?.taskId;

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Log successful action
          this.auditLogService.log({
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            action,
            resource,
            resourceId,
            details: {
              method,
              path,
              statusCode: 200,
            },
            ipAddress: request.ip,
            userAgent: request.get('user-agent'),
          });
        },
        error: (error) => {
          // Log failed action
          this.auditLogService.log({
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            action:
              error.status === 403
                ? AuditAction.ACCESS_DENIED
                : AuditAction.PERMISSION_DENIED,
            resource,
            resourceId,
            details: {
              method,
              path,
              error: error.message,
              statusCode: error.status,
            },
            ipAddress: request.ip,
            userAgent: request.get('user-agent'),
          });
        },
      })
    );
  }

  private getActionFromRequest(method: string, path: string): AuditAction | null {
    // Task actions
    if (path.includes('tasks')) {
      if (method === 'POST') return AuditAction.TASK_CREATE;
      if (method === 'GET') return AuditAction.TASK_READ;
      if (method === 'PUT' || method === 'PATCH') return AuditAction.TASK_UPDATE;
      if (method === 'DELETE') return AuditAction.TASK_DELETE;
    }

    // User actions
    if (path.includes('users')) {
      if (method === 'POST') return AuditAction.USER_CREATE;
      if (method === 'GET') return AuditAction.USER_READ;
      if (method === 'PUT' || method === 'PATCH') return AuditAction.USER_UPDATE;
      if (method === 'DELETE') return AuditAction.USER_DELETE;
    }

    // Organization actions
    if (path.includes('organizations')) {
      if (method === 'POST') return AuditAction.ORG_CREATE;
      if (method === 'GET') return AuditAction.ORG_READ;
      if (method === 'PUT' || method === 'PATCH') return AuditAction.ORG_UPDATE;
      if (method === 'DELETE') return AuditAction.ORG_DELETE;
    }

    // Auth actions
    if (path.includes('login')) {
      return AuditAction.LOGIN;
    }

    return null;
  }

  private getResourceFromPath(path: string): string {
    if (path.includes('tasks')) return 'task';
    if (path.includes('users')) return 'user';
    if (path.includes('organizations')) return 'organization';
    if (path.includes('auth')) return 'auth';
    return 'unknown';
  }
}
