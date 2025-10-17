import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from '../entities/task.entity';
import { RbacService } from '../services/rbac.service';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, AuditLog])],
  controllers: [TasksController],
  providers: [TasksService, RbacService, AuditLogService],
  exports: [TasksService],
})
export class TasksModule {}
