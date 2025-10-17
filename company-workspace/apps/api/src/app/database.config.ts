import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './user.entity';

export const sqliteConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [User],
  synchronize: true,
};

export const postgresConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'company_db',
  entities: [User],
  synchronize: true,
};

// Choose the configuration based on environment variable
export const databaseConfig =
  process.env.DB_TYPE === 'postgres' ? postgresConfig : sqliteConfig;
