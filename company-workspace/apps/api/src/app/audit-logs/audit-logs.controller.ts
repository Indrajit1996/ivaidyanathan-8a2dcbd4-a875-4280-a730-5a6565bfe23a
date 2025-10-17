import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../enums/permission.enum';
import { AuditLogService } from '../services/audit-log.service';
import { AuditAction } from '../entities/audit-log.entity';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /audit-logs - Get audit logs with optional filters
   * Only accessible to OWNER and ADMIN roles
   */
  @Get()
  @RequirePermissions(Permission.AUDIT_LOG_READ)
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};

    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit, 10);

    return this.auditLogService.getAuditLogs(filters);
  }
}
