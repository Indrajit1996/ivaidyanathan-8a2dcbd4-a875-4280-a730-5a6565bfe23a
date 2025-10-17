import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './database.config';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { User } from './user.entity';
import { Organization } from './entities/organization.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User, Organization]),
    AuthModule,
    TasksModule,
    OrganizationsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
