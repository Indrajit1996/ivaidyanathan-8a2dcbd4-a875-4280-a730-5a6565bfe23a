# Backend Structure Analysis - RBAC Implementation Guide

## Executive Summary

This monorepo uses **NestJS** as the backend framework with **PostgreSQL/SQLite** database and **TypeORM** as the ORM. The authentication system is already implemented with **JWT** and basic **RBAC** (Role-Based Access Control) using **Passport** authentication strategy.

The backend is located in `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/` and is ready for RBAC feature enhancements.

---

## 1. Technology Stack Overview

### Backend Framework
- **NestJS 11.0.0** - Node.js framework built on Express with TypeScript
- **Monorepo Tool**: Nx 21.6.5
- **Node Version**: TypeScript 5.9.2

### Authentication & Authorization
- **JWT (JSON Web Tokens)**: @nestjs/jwt 11.0.1
- **Passport.js**: passport 0.7.0 with passport-jwt 4.0.1
- **Password Hashing**: bcrypt 6.0.0

### Database & ORM
- **Primary DB**: PostgreSQL 8.16.3 (configured, can fallback to SQLite 5.1.7)
- **ORM**: TypeORM 0.3.27
- **Integration**: @nestjs/typeorm 11.0.0

### Other Dependencies
- **HTTP Server**: @nestjs/platform-express 11.0.0
- **Dependency Injection**: @nestjs/common 11.0.0, @nestjs/core 11.0.0
- **Utilities**: reflect-metadata 0.1.13, rxjs 7.8.0

---

## 2. Backend Application Structure

```
/Users/indra/Desktop/company-assessment/company-workspace/apps/api/
├── src/
│   ├── main.ts                          # Entry point
│   └── app/
│       ├── app.module.ts                # Root module
│       ├── app.controller.ts            # Example protected routes
│       ├── app.service.ts               # Service layer
│       ├── user.entity.ts               # User entity with roles
│       ├── seed.service.ts              # Database seeding
│       ├── database.config.ts           # Database configuration
│       └── auth/
│           ├── auth.module.ts           # Auth module
│           ├── auth.service.ts          # JWT & auth logic
│           ├── auth.controller.ts       # Login endpoint
│           ├── jwt.strategy.ts          # Passport JWT strategy
│           ├── decorators/
│           │   └── roles.decorator.ts   # @Roles() decorator
│           ├── guards/
│           │   ├── jwt-auth.guard.ts    # JWT authentication guard
│           │   └── roles.guard.ts       # RBAC authorization guard
│           └── dto/
│               └── login.dto.ts         # Login request DTO
├── project.json                         # Nx project config
├── tsconfig.*.json                      # TypeScript configs
└── webpack.config.js                    # Build configuration
```

---

## 3. Current Authentication Implementation

### 3.1 User Entity (User Model)

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/user.entity.ts`

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  OWNER = 'OWNER',      // Highest privileges
  ADMIN = 'ADMIN',      // Administrative access
  VIEWER = 'VIEWER'     // Read-only access
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.VIEWER
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Key Points**:
- UUID primary key
- Three predefined roles
- Email uniqueness constraint
- Bcrypt-hashed password
- Timestamps for audit trail

---

### 3.2 JWT Configuration

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: {
        expiresIn: '24h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
```

**Configuration Details**:
- JWT Secret from environment variable
- 24-hour token expiration
- Passport's JWT strategy as default
- Exports available to other modules

---

### 3.3 Authentication Service

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }
}
```

**Key Features**:
- Password validation with bcrypt comparison
- JWT payload includes user ID, email, and role
- Generic error message for security
- Returns token and user info on successful login

---

### 3.4 JWT Strategy (Passport)

**File**: `/Users/indra/Desktop/company-workspace/apps/api/src/app/auth/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub }
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
}
```

**Key Features**:
- Extracts JWT from Authorization header (Bearer token)
- Validates token expiration
- Verifies user still exists in database
- Attaches user object to request

---

## 4. Authorization Implementation

### 4.1 JWT Authentication Guard

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Usage**: Applied with `@UseGuards(JwtAuthGuard)` to protect routes from unauthenticated users.

---

### 4.2 Roles Authorization Guard

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

**Key Features**:
- Uses NestJS Reflector to read metadata from @Roles decorator
- Checks if user's role matches required roles
- Returns true if no specific roles required
- Performs simple string equality check

---

### 4.3 Roles Decorator

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**Usage**: 
```typescript
@Get('admin-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
adminRoute() { ... }
```

---

### 4.4 Auth Controller

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

**Endpoints**:
- `POST /api/auth/login` - Authenticate user and return JWT token

---

### 4.5 Example Protected Routes

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/app.controller.ts`

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  // Protected route - requires authentication
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return {
      message: 'This is a protected route',
      user: req.user
    };
  }

  // Admin-only route
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  getAdminData(@Request() req) {
    return {
      message: 'This route is only accessible to ADMIN and OWNER roles',
      user: req.user,
      data: 'Sensitive admin data'
    };
  }

  // Owner-only route
  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  getOwnerData(@Request() req) {
    return {
      message: 'This route is only accessible to OWNER role',
      user: req.user,
      data: 'Super sensitive owner data'
    };
  }
}
```

---

## 5. Database Configuration

### 5.1 Database Setup

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/database.config.ts`

```typescript
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
```

**Features**:
- Supports both PostgreSQL and SQLite
- Auto-synchronization enabled (creates tables automatically)
- Environment-based database selection
- Default PostgreSQL fallback

### 5.2 Environment Configuration

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/.env`

```env
# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=company_db

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

---

### 5.3 Database Seeding

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/seed.service.ts`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const adminEmail = 'vindrajit1996@gmail.com';

    const existingUser = await this.userRepository.findOne({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@1234', 10);

    const adminUser = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await this.userRepository.save(adminUser);
    console.log(`Admin user created: ${adminEmail}`);
  }
}
```

**Default Credentials**:
- Email: `vindrajit1996@gmail.com`
- Password: `Admin@1234`
- Role: `ADMIN`

---

## 6. API Endpoints Overview

### 6.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login and get JWT token | No |

### 6.2 Protected Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/profile` | Get current user profile | Any authenticated user |
| GET | `/api/admin` | Get admin data | ADMIN, OWNER |
| GET | `/api/owner` | Get owner data | OWNER |

---

## 7. Application Module Configuration

**File**: `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './database.config';
import { AuthModule } from './auth/auth.module';
import { User } from './user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
```

---

## 8. Current Limitations & Opportunities for RBAC Enhancement

### Current Implementation Status
- ✅ Basic JWT authentication
- ✅ Three-tier role system (OWNER, ADMIN, VIEWER)
- ✅ Role-based route guards
- ✅ Single user entity with role field
- ✅ Bcrypt password hashing

### Areas for Enhancement (RBAC Features)

1. **Organization-level RBAC**
   - Create Organization entity
   - Implement organization membership
   - Define organization-specific roles
   - Multi-tenancy support

2. **Permission-level Access Control**
   - Define granular permissions (not just roles)
   - Create Permission entity
   - Map roles to permissions
   - Custom permission decorators

3. **Resource-level RBAC**
   - Add ownership/responsibility tracking
   - Resource-specific role assignment
   - Hierarchical resource access

4. **Advanced Features**
   - Role hierarchies (owner > admin > viewer)
   - Dynamic role assignment
   - Attribute-Based Access Control (ABAC)
   - Audit logging for authorization
   - Session management
   - API key/token management

---

## 9. Starting the Backend

```bash
# Install dependencies (if needed)
npm install

# Start the backend in development mode
npx nx serve api

# Backend will run on: http://localhost:3000
# API endpoints available at: http://localhost:3000/api
```

---

## 10. Testing Authentication Flow

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vindrajit1996@gmail.com",
    "password": "Admin@1234"
  }'
```

### Test Protected Route
```bash
# Replace TOKEN with the access_token from login response
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer TOKEN"
```

### Test Admin Route
```bash
curl http://localhost:3000/api/admin \
  -H "Authorization: Bearer TOKEN"
```

---

## 11. Key Files Reference

| File | Purpose |
|------|---------|
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/user.entity.ts` | User model with roles |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/auth.module.ts` | Auth module with JWT config |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/auth.service.ts` | Authentication logic |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/auth.controller.ts` | Login endpoint |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/jwt.strategy.ts` | Passport JWT strategy |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/guards/jwt-auth.guard.ts` | JWT authentication guard |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/guards/roles.guard.ts` | RBAC guard |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/auth/decorators/roles.decorator.ts` | @Roles() decorator |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/database.config.ts` | Database configuration |
| `/Users/indra/Desktop/company-assessment/company-workspace/apps/api/src/app/seed.service.ts` | Database seeding |
| `/Users/indra/Desktop/company-assessment/company-workspace/.env` | Environment variables |

---

## Summary

The backend is built with **NestJS**, **TypeORM**, and **PostgreSQL**, featuring a working JWT authentication system and basic RBAC with three user roles. The architecture is clean and modular, making it straightforward to extend with additional RBAC features like organizations, granular permissions, and resource-level access control. The codebase is production-ready for authentication and provides a solid foundation for implementing more sophisticated authorization schemes.

