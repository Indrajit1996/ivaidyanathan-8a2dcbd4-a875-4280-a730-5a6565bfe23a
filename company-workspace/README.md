# Company Assessment Monorepo

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A modern full-stack monorepo with **NestJS backend** and **Angular frontend**, powered by **NX**. This project demonstrates a production-ready architecture with role-based access control (RBAC), multi-tenant organization hierarchy, and JWT authentication.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Setup Instructions](#-setup-instructions)
- [Architecture Overview](#-architecture-overview)
- [Data Model](#-data-model)
- [Access Control Implementation](#-access-control-implementation)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Future Considerations](#-future-considerations)

## 🚀 Quick Start

**New to this project?** Start here: [**QUICKSTART.md**](QUICKSTART.md)

**Need detailed docs?** See: [**SETUP.md**](SETUP.md)

## 📦 What's Inside

- **Backend**: NestJS + TypeORM + SQLite/PostgreSQL
- **Frontend**: Angular + TailwindCSS
- **Monorepo**: NX build system with smart caching
- **Authentication**: JWT-based auth with role-based access control
- **Multi-tenancy**: Organization hierarchy with inherited permissions
- **Testing**: Jest (unit) + Playwright (E2E)
- **Code Quality**: ESLint + Prettier

## ⚙️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone git@github.com:Indrajit1996/ivaidyanathan-8a2dcbd4-a875-4280-a730-5a6565bfe23a.git
cd company-workspace

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the `apps/backend` directory:

```bash
# apps/backend/.env

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=1h

# Database Configuration
DB_TYPE=sqlite
DB_DATABASE=./data/database.sqlite

# For PostgreSQL (alternative to SQLite):
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=postgres
# DB_DATABASE=company_db

# Application
PORT=3000
NODE_ENV=development
```

**Important**:
- Change `JWT_SECRET` to a strong, randomly generated string in production
- Use a secure password manager or environment variable management system for production secrets
- Never commit `.env` files to version control

### Running the Applications

```bash
# Start backend (http://localhost:3000)
npx nx serve backend

# Start frontend (http://localhost:4200) - in a new terminal
npx nx serve frontend

# Or run both concurrently
npm run start:all
```

### Database Setup

The application automatically creates and migrates the SQLite database on first run. For PostgreSQL:

```bash
# Run migrations
npx nx run backend:typeorm migration:run

# Create a new migration (after schema changes)
npx nx run backend:typeorm migration:generate -- -n MigrationName
```

```
Credentials to Login

user-name: vindrajit1996@gmail.com
password: Admin@1234

user-name: chrisKaram@gmail.com
password: Admin@1234

user-name: testuser@gmail.com
password: Admin@1234
```

```
username                             access
vindrajit1996@gmail.com              ADMIN
chrisKaram@gmail.com                 OWNER
testuser@gmail.com                   VIEWER
```



## 🏗️ Architecture Overview

### NX Monorepo Layout

This project uses NX to manage a monorepo structure with the following rationale:

```
company-workspace/
├── apps/
│   ├── backend/          # NestJS API server
│   └── dashboard/        # Angular frontend
├── libs/
│   ├── shared/
│   │   ├── data-access/  # Shared data models, DTOs, interfaces
│   │   ├── utils/        # Common utilities and helpers
│   │   └── ui/           # Reusable UI components
│   └── auth/             # Authentication/authorization logic
└── tools/                # Build scripts and utilities
```

**Why NX Monorepo?**

1. **Code Sharing**: DTOs, interfaces, and types are shared between frontend and backend, ensuring type safety across the stack
2. **Dependency Management**: Single `node_modules` and consistent versioning
3. **Build Optimization**: NX's smart caching system only rebuilds what changed
4. **Developer Experience**: Consistent commands across all projects (`nx serve`, `nx test`, `nx build`)
5. **Scalability**: Easy to add new apps or libraries as the project grows

### Shared Libraries

#### `@company/shared/data-access`
- **Purpose**: TypeScript interfaces and DTOs shared between frontend and backend
- **Contents**: User, Organization, Role, Permission, Task models
- **Benefit**: Type safety across API boundaries, eliminating runtime errors

#### `@company/shared/utils`
- **Purpose**: Common utility functions
- **Contents**: Date formatters, validators, constants
- **Benefit**: DRY principle, consistent behavior

#### `@company/auth`
- **Purpose**: Authentication and authorization logic
- **Contents**: JWT guards, decorators, role validators
- **Benefit**: Centralized security logic, reusable across modules

### Technology Stack

**Backend (NestJS)**
- TypeORM for database operations
- Passport.js for JWT authentication
- Class-validator for DTO validation
- Modular architecture with dependency injection

**Frontend (Angular)**
- Standalone components
- RxJS for reactive state management
- TailwindCSS for styling
- HTTP interceptors for auth token injection

## 📊 Data Model

### Database Schema

The application uses a relational database with the following core entities:

#### Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│  Organization   │       │      User        │
├─────────────────┤       ├──────────────────┤
│ id (PK)         │◄─────┐│ id (PK)          │
│ name            │      ││ email            │
│ parentId (FK)   │──┐   ││ password (hash)  │
│ createdAt       │  │   ││ firstName        │
│ updatedAt       │  │   ││ lastName         │
└─────────────────┘  │   │└──────────────────┘
        ▲            │   │         │
        │            │   │         │
        └────────────┘   │         │
     (self-reference)    │         │
                         │         ▼
┌─────────────────┐     │  ┌──────────────────┐
│   Permission    │     │  │ UserOrganization │
├─────────────────┤     │  ├──────────────────┤
│ id (PK)         │     │  │ id (PK)          │
│ resource        │     └─►│ organizationId   │
│ action          │        │ userId           │
│ description     │        │ roleId           │
└─────────────────┘        └──────────────────┘
        ▲                           │
        │                           │
        │                           ▼
        │                  ┌──────────────────┐
        │                  │      Role        │
        │                  ├──────────────────┤
        └──────────────────┤ id (PK)          │
          (many-to-many)   │ name             │
                           │ level            │
                           └──────────────────┘

┌─────────────────┐
│      Task       │
├─────────────────┤
│ id (PK)         │
│ title           │
│ description     │
│ status          │
│ priority        │
│ assigneeId (FK) │───► User
│ organizationId  │───► Organization
│ dueDate         │
│ createdAt       │
└─────────────────┘
```

### Entity Descriptions

**Organization**
- Hierarchical structure with self-referencing `parentId`
- Supports unlimited nesting depth (e.g., Company > Department > Team)
- Permissions cascade down the hierarchy

**User**
- Standard user account with encrypted password
- Can belong to multiple organizations with different roles

**UserOrganization** (Join Table)
- Links users to organizations with specific roles
- A user can have different roles in different organizations
- Example: Alice is Admin in "Engineering" but Member in "HR"

**Role**
- Hierarchical levels: Admin (3) > Manager (2) > Member (1)
- Roles determine which permissions a user has
- Higher-level roles can manage lower-level users

**Permission**
- Defines granular access rights (resource:action)
- Examples: `tasks:create`, `users:read`, `organizations:update`
- Assigned to roles via many-to-many relationship

**Task**
- Belongs to an organization
- Can be assigned to a user
- Access controlled based on organization membership and role

### Key Design Decisions

1. **Multi-tenancy via Organizations**: Each resource is scoped to an organization, ensuring data isolation
2. **Role Hierarchy**: Numeric levels enable simple "can manage" checks
3. **Permission-based Authorization**: Fine-grained control beyond simple roles
4. **Cascading Access**: Users inherit access to all child organizations

## 🔐 Access Control Implementation

### Overview

The system implements a sophisticated Role-Based Access Control (RBAC) system with organizational hierarchy support.

### How It Works

#### 1. Role Hierarchy

Roles have numeric levels that determine management capabilities:

```typescript
Admin    (level: 3)  // Can manage Managers and Members
Manager  (level: 2)  // Can manage Members
Member   (level: 1)  // Base level, no management rights
```

**Rule**: A user can only manage users with a lower role level than their own within the same organization context.

#### 2. Organization Hierarchy

Organizations form a tree structure:

```
Acme Corp (root)
  ├── Engineering
  │     ├── Backend Team
  │     └── Frontend Team
  └── Sales
        └── Regional Sales
```

**Access Rules**:
- Users in parent organizations can access child organization resources
- Users in "Engineering" can see tasks in "Backend Team" and "Frontend Team"
- Users in "Backend Team" cannot see "Sales" tasks

#### 3. Permission System

Permissions are defined as `resource:action` pairs:

```typescript
// Examples
permissions = [
  'tasks:create',
  'tasks:read',
  'tasks:update',
  'tasks:delete',
  'users:read',
  'users:update',
  'organizations:create'
]
```

Permissions are:
- Assigned to roles
- Checked via guards and decorators
- Evaluated in the context of the user's organization

### JWT Authentication Integration

#### Authentication Flow

1. **Login**: User provides email/password
2. **Validation**: Backend verifies credentials
3. **Token Generation**: JWT created with payload:
   ```json
   {
     "sub": "user-id",
     "email": "user@example.com",
     "userOrganizations": [
       {
         "organizationId": "org-1",
         "role": "Admin",
         "roleLevel": 3
       }
     ],
     "iat": 1234567890,
     "exp": 1234571490
   }
   ```
4. **Client Storage**: Frontend stores token in localStorage
5. **Request Authentication**: Token sent in `Authorization: Bearer <token>` header
6. **Token Verification**: Backend validates signature and expiration
7. **Access Control**: Guards check role and permissions from token

#### Guards and Decorators

**JwtAuthGuard**
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user; // User from JWT payload
}
```

**RolesGuard**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Manager')
@Get('sensitive-data')
getSensitiveData() {
  // Only Admins and Managers can access
}
```

**PermissionsGuard**
```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('tasks:delete')
@Delete('tasks/:id')
deleteTask(@Param('id') id: string) {
  // Only users with 'tasks:delete' permission
}
```

#### Organization Context

Controllers validate organization access:

```typescript
@Get('organizations/:orgId/tasks')
async getTasks(@Param('orgId') orgId: string, @User() user) {
  // Check if user has access to orgId or its parent
  const hasAccess = await this.authService.canAccessOrganization(
    user.id,
    orgId
  );

  if (!hasAccess) {
    throw new ForbiddenException();
  }

  return this.tasksService.findByOrganization(orgId);
}
```

### Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Secret**: Environment variable, never hardcoded
3. **Token Expiration**: Configurable (default 1 hour)
4. **Route Protection**: All routes require authentication by default
5. **Role Validation**: Guards prevent privilege escalation
6. **Input Validation**: DTOs with class-validator decorators

## 📡 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All endpoints except `/auth/login` and `/auth/register` require a JWT token:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication

**POST /auth/register**

Register a new user.

```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

// Response (201 Created)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**POST /auth/login**

Authenticate and receive JWT token.

```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "organizations": [
      {
        "id": "org-uuid",
        "name": "Engineering",
        "role": "Admin"
      }
    ]
  }
}
```

#### Organizations

**GET /organizations**

List all organizations accessible to the user.

```json
// Response (200 OK)
[
  {
    "id": "uuid",
    "name": "Acme Corp",
    "parentId": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "children": [
      {
        "id": "child-uuid",
        "name": "Engineering",
        "parentId": "uuid"
      }
    ]
  }
]
```

**POST /organizations**

Create a new organization (requires `organizations:create` permission).

```json
// Request
{
  "name": "New Department",
  "parentId": "parent-org-uuid" // optional
}

// Response (201 Created)
{
  "id": "new-uuid",
  "name": "New Department",
  "parentId": "parent-org-uuid",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**GET /organizations/:id**

Get organization details.

```json
// Response (200 OK)
{
  "id": "uuid",
  "name": "Engineering",
  "parentId": "parent-uuid",
  "members": [
    {
      "userId": "user-uuid",
      "email": "john@example.com",
      "role": "Admin",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "children": []
}
```

#### Users

**GET /users**

List all users (requires `users:read` permission).

```json
// Response (200 OK)
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "organizations": [
      {
        "organizationId": "org-uuid",
        "organizationName": "Engineering",
        "role": "Admin"
      }
    ]
  }
]
```

**POST /organizations/:orgId/users**

Add user to organization with a role.

```json
// Request
{
  "userId": "user-uuid",
  "roleId": "role-uuid"
}

// Response (201 Created)
{
  "id": "user-org-uuid",
  "userId": "user-uuid",
  "organizationId": "org-uuid",
  "roleId": "role-uuid",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Tasks

**GET /organizations/:orgId/tasks**

Get all tasks for an organization.

```json
// Response (200 OK)
[
  {
    "id": "task-uuid",
    "title": "Implement feature X",
    "description": "Detailed description here",
    "status": "in_progress",
    "priority": "high",
    "assignee": {
      "id": "user-uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "dueDate": "2024-02-01T00:00:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**POST /tasks**

Create a new task.

```json
// Request
{
  "title": "New task",
  "description": "Task description",
  "organizationId": "org-uuid",
  "assigneeId": "user-uuid",
  "priority": "medium",
  "dueDate": "2024-02-15T00:00:00Z"
}

// Response (201 Created)
{
  "id": "new-task-uuid",
  "title": "New task",
  "status": "todo",
  "priority": "medium",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**PATCH /tasks/:id**

Update task (requires appropriate permissions).

```json
// Request
{
  "status": "completed",
  "priority": "low"
}

// Response (200 OK)
{
  "id": "task-uuid",
  "status": "completed",
  "priority": "low",
  "updatedAt": "2024-01-16T14:20:00Z"
}
```

**DELETE /tasks/:id**

Delete a task (requires `tasks:delete` permission).

```json
// Response (200 OK)
{
  "message": "Task deleted successfully"
}
```

### Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common status codes:
- `400` Bad Request - Invalid input
- `401` Unauthorized - Missing or invalid token
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource doesn't exist
- `500` Internal Server Error - Server error

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npx nx test backend
npx nx test dashboard

# Run tests with coverage
npx nx test backend --coverage

# Run E2E tests
npx nx e2e dashboard-e2e
```

### Test Structure

- **Unit Tests**: Located next to source files (`*.spec.ts`)
- **Integration Tests**: In `test/` directories
- **E2E Tests**: Separate e2e projects

## 🔮 Future Considerations

### Advanced Role Delegation

**Planned Features**:
- **Temporary Role Assignment**: Grant elevated permissions for a limited time
- **Delegation Chains**: Allow managers to delegate specific permissions to team members
- **Custom Roles**: Per-organization custom roles beyond the default hierarchy
- **Role Templates**: Predefined permission sets for common positions

**Implementation Approach**:
```typescript
interface RoleDelegation {
  fromUserId: string;
  toUserId: string;
  permissions: string[];
  organizationId: string;
  expiresAt: Date;
  reason?: string;
}
```

### Production-Ready Security Enhancements

#### JWT Refresh Tokens

**Current**: Access tokens expire after 1 hour, requiring re-login
**Planned**:
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Refresh token rotation on use
- Refresh token storage in httpOnly cookies

```typescript
// Planned implementation
POST /auth/refresh
{
  "refreshToken": "long-lived-token"
}
// Returns new access + refresh token pair
```

#### CSRF Protection

**Planned**:
- CSRF tokens for state-changing operations
- Double-submit cookie pattern
- SameSite cookie attributes

#### RBAC Caching

**Current**: Database queries on every permission check
**Planned**:
- Redis cache for user permissions
- Cache invalidation on role/permission changes
- TTL-based cache expiration
- Distributed caching for horizontal scaling

```typescript
// Caching strategy
const cacheKey = `user:${userId}:permissions:${orgId}`;
const ttl = 300; // 5 minutes

// Cache structure
{
  "user:123:permissions:org-456": {
    "role": "Admin",
    "level": 3,
    "permissions": ["tasks:*", "users:read", ...]
  }
}
```

### Scaling Permission Checks Efficiently

**Current Bottlenecks**:
- N+1 queries for organization hierarchy
- Repeated permission lookups

**Optimization Strategies**:

1. **Materialized Paths**: Pre-compute organization hierarchies
   ```typescript
   // Instead of recursive queries
   organization.path = "/acme-corp/engineering/backend-team"
   ```

2. **Permission Bitmap**: Convert permissions to bit flags
   ```typescript
   // Fast bitwise operations
   const canRead = userPermissions & PERMISSION_READ;
   ```

3. **Batch Loading**: Use DataLoader pattern for GraphQL
   ```typescript
   const permissionLoader = new DataLoader(loadPermissionsBatch);
   ```

4. **Database Indexes**:
   ```sql
   CREATE INDEX idx_user_org ON user_organizations(user_id, organization_id);
   CREATE INDEX idx_org_parent ON organizations(parent_id);
   ```

### Additional Considerations

- **Audit Logging**: Track all permission changes and access attempts
- **Multi-factor Authentication**: Add TOTP/SMS for sensitive operations
- **API Rate Limiting**: Prevent brute force and DDoS attacks
- **Data Encryption**: Encrypt sensitive fields at rest
- **Compliance**: GDPR data export, right to deletion
- **Observability**: Application metrics, distributed tracing
- **Feature Flags**: Gradual rollout of new permissions/features

## 🛠️ Running NX Tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build backend
npx nx test dashboard
npx nx lint backend
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:
```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
