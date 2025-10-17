import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';

export const sqliteConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [User, Organization, Task, AuditLog],
  synchronize: true,
};

export const postgresConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'company_db',
  entities: [User, Organization, Task, AuditLog],
  synchronize: true,
};

// Choose the configuration based on environment variable
export const databaseConfig =
  process.env.DB_TYPE === 'postgres' ? postgresConfig : sqliteConfig;
