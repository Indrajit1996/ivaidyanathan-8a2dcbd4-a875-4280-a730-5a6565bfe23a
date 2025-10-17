import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogsController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogsModule {}
