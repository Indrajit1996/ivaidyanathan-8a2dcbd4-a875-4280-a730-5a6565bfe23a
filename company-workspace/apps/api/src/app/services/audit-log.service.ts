import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

export interface AuditLogData {
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: data.userId,
        userEmail: data.userEmail,
        userRole: data.userRole,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      await this.auditLogRepository.save(auditLog);

      // Also log to console/file for immediate visibility
      this.logger.log(
        `[AUDIT] ${data.userEmail} (${data.userRole}) performed ${data.action} on ${data.resource}${data.resourceId ? ` (${data.resourceId})` : ''}`
      );

      if (data.details) {
        this.logger.debug(`[AUDIT] Details: ${JSON.stringify(data.details)}`);
      }
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (filters?.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters?.action) {
      query.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters?.resource) {
      query.andWhere('audit.resource = :resource', {
        resource: filters.resource,
      });
    }

    if (filters?.startDate) {
      query.andWhere('audit.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('audit.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    query.orderBy('audit.createdAt', 'DESC');

    if (filters?.limit) {
      query.take(filters.limit);
    }

    return query.getMany();
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId: string
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        resource,
        resourceId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }
}
