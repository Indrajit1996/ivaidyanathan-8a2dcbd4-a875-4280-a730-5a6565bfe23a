# Authentication & RBAC Implementation Guide

## Overview

This document describes the authentication system implemented with JWT, PostgreSQL, and Role-Based Access Control (RBAC).

## Features Implemented

### Backend (NestJS)
- JWT-based authentication
- PostgreSQL database with TypeORM
- User entity with roles (OWNER, ADMIN, VIEWER)
- Password hashing with bcrypt
- RBAC guards and decorators
- Database seeding for default admin user
- Protected API routes

### Frontend (Angular)
- Login page at `/login`
- Auth service for authentication management
- HTTP interceptor for JWT token attachment
- Auth guard for protected routes
- Dashboard page with user info and role display
- Automatic routing based on authentication status

## Default Credentials

```
Email: vindrajit1996@gmail.com
Password: Admin@1234
Role: ADMIN
```

This user is automatically created when the backend starts for the first time.

## Getting Started

### 1. Setup PostgreSQL Database

Make sure PostgreSQL is running and create a database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE company_db;

# Exit PostgreSQL
\q
```

### 2. Environment Configuration

The `.env` file is already configured with:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=company_db

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

**Important:** Change `JWT_SECRET` in production!

### 3. Install Dependencies

Dependencies are already installed, but if needed:

```bash
npm install
```

### 4. Start the Backend

```bash
npx nx serve api
```

The backend will:
- Start on `http://localhost:3000`
- Connect to PostgreSQL
- Create the `users` table automatically (via TypeORM synchronize)
- Seed the default admin user
- API available at `http://localhost:3000/api`

### 5. Start the Frontend

In a new terminal:

```bash
npx nx serve dashboard
```

The frontend will:
- Start on `http://localhost:4200`
- Open in your browser automatically
- Redirect to `/login` if not authenticated

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "vindrajit1996@gmail.com",
  "password": "Admin@1234"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "vindrajit1996@gmail.com",
    "role": "ADMIN"
  }
}
```

### Protected Routes (Examples)

#### GET `/api/profile`
Requires: Authentication

Returns the current user's profile.

#### GET `/api/admin`
Requires: Authentication + ADMIN or OWNER role

Returns admin-only data.

#### GET `/api/owner`
Requires: Authentication + OWNER role only

Returns owner-only data.

## User Roles & Permissions

### OWNER
- Highest level access
- Full system control
- Can access all resources
- Example use: System owner, super admin

### ADMIN
- Administrative access
- Can manage users
- Can access most resources
- Example use: Company administrators

### VIEWER
- Read-only access
- Can view resources
- Cannot modify anything
- Example use: Auditors, read-only users

## Project Structure

### Backend Structure

```
apps/api/src/app/
├── user.entity.ts              # User entity with roles
├── seed.service.ts             # Database seeding
├── app.module.ts               # Main module
├── app.controller.ts           # Example protected routes
└── auth/
    ├── auth.module.ts          # Auth module
    ├── auth.service.ts         # Auth service with JWT
    ├── auth.controller.ts      # Login endpoint
    ├── jwt.strategy.ts         # Passport JWT strategy
    ├── dto/
    │   └── login.dto.ts        # Login DTO
    ├── guards/
    │   ├── jwt-auth.guard.ts   # JWT authentication guard
    │   └── roles.guard.ts      # RBAC guard
    └── decorators/
        └── roles.decorator.ts  # @Roles decorator
```

### Frontend Structure

```
apps/dashboard/src/app/
├── app.routes.ts               # Route configuration
├── app.config.ts               # App config with HTTP client
├── auth/
│   ├── auth.service.ts         # Auth service
│   ├── auth.guard.ts           # Route guard
│   └── auth.interceptor.ts     # HTTP interceptor
├── login/
│   ├── login.component.ts      # Login component
│   ├── login.component.html    # Login template
│   └── login.component.css     # Login styles
└── dashboard/
    ├── dashboard.component.ts  # Dashboard component
    ├── dashboard.component.html# Dashboard template
    └── dashboard.component.css # Dashboard styles
```

## How to Use RBAC in Your Code

### Backend - Protecting Routes

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller('example')
export class ExampleController {

  // Requires authentication only
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  protectedRoute() {
    return { message: 'Authenticated users only' };
  }

  // Requires ADMIN or OWNER role
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  adminRoute() {
    return { message: 'Admin or Owner only' };
  }

  // Requires OWNER role only
  @Get('owner-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  ownerRoute() {
    return { message: 'Owner only' };
  }
}
```

### Frontend - Protecting Routes

In `app.routes.ts`:

```typescript
import { authGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'protected',
    component: ProtectedComponent,
    canActivate: [authGuard]  // Requires authentication
  }
];
```

### Frontend - Conditional UI Based on Role

```typescript
import { Component } from '@angular/core';
import { AuthService } from './auth/auth.service';

@Component({...})
export class MyComponent {
  constructor(public authService: AuthService) {}

  get currentUser() {
    return this.authService.currentUserValue;
  }

  get isAdmin() {
    return this.currentUser?.role === 'ADMIN' ||
           this.currentUser?.role === 'OWNER';
  }

  get isOwner() {
    return this.currentUser?.role === 'OWNER';
  }
}
```

In template:

```html
@if (isAdmin) {
  <button>Admin Action</button>
}

@if (isOwner) {
  <button>Owner Action</button>
}
```

## Creating Additional Users

To create additional users, you can:

1. **Add to seed service** (apps/api/src/app/seed.service.ts):

```typescript
const newUser = this.userRepository.create({
  email: 'user@example.com',
  password: await bcrypt.hash('password123', 10),
  role: UserRole.VIEWER,
});
await this.userRepository.save(newUser);
```

2. **Create a registration endpoint** (optional):

```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const user = this.userRepository.create({
    email: dto.email,
    password: hashedPassword,
    role: UserRole.VIEWER, // Default role
  });
  return await this.userRepository.save(user);
}
```

## Testing the Implementation

### 1. Test Login

1. Start both backend and frontend
2. Navigate to `http://localhost:4200`
3. You should be redirected to `/login`
4. Enter credentials:
   - Email: `vindrajit1996@gmail.com`
   - Password: `Admin@1234`
5. Click "Sign In"
6. You should be redirected to dashboard

### 2. Test Protected Routes

Using curl or Postman:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vindrajit1996@gmail.com","password":"Admin@1234"}'

# Copy the access_token from response

# Access protected route
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Access admin route (should work with ADMIN role)
curl http://localhost:3000/api/admin \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Access owner route (should fail with 403 for ADMIN)
curl http://localhost:3000/api/owner \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test RBAC

Create a VIEWER user and test that they cannot access admin routes.

## Security Best Practices

1. **Change JWT Secret**: Update `JWT_SECRET` in `.env` for production
2. **Use HTTPS**: In production, always use HTTPS
3. **Token Expiration**: Tokens expire in 24h (configurable in `.env`)
4. **Password Requirements**: Consider adding password validation
5. **Rate Limiting**: Add rate limiting to prevent brute force attacks
6. **Environment Variables**: Never commit `.env` to version control

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Check if port 3000 is available

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check CORS configuration in `apps/api/src/main.ts`
- Check API_URL in auth service

### Login fails
- Check backend logs for errors
- Verify database has the seeded user
- Check password is exactly `Admin@1234`

### Database connection errors
- Verify PostgreSQL is running
- Check database exists: `psql -U postgres -l`
- Verify credentials in `.env`

## Next Steps

1. Add password reset functionality
2. Add user registration endpoint
3. Add email verification
4. Add refresh tokens
5. Add user management UI (CRUD operations)
6. Add audit logging
7. Add two-factor authentication
8. Add password complexity requirements

## Support

For issues or questions, check:
- NestJS documentation: https://docs.nestjs.com
- Angular documentation: https://angular.dev
- TypeORM documentation: https://typeorm.io
- Passport JWT: http://www.passportjs.org/packages/passport-jwt/
