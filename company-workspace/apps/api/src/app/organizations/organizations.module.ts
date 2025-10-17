import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from '../entities/organization.entity';
import { User } from '../user.entity';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User, AuditLog])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, AuditLogService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
