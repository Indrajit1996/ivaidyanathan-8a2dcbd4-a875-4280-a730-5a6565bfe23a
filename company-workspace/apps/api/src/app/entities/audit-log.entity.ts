import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',

  // Task actions
  TASK_CREATE = 'TASK_CREATE',
  TASK_READ = 'TASK_READ',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_DELETE = 'TASK_DELETE',

  // User actions
  USER_CREATE = 'USER_CREATE',
  USER_READ = 'USER_READ',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',

  // Organization actions
  ORG_CREATE = 'ORG_CREATE',
  ORG_READ = 'ORG_READ',
  ORG_UPDATE = 'ORG_UPDATE',
  ORG_DELETE = 'ORG_DELETE',

  // Access control
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['resource', 'resourceId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  userEmail: string;

  @Column()
  userRole: string;

  @Column({
    type: 'varchar',
    enum: AuditAction,
  })
  @Index()
  action: AuditAction;

  @Column()
  @Index()
  resource: string;

  @Column({ nullable: true })
  @Index()
  resourceId: string;

  @Column({ type: 'json', nullable: true })
  details: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
