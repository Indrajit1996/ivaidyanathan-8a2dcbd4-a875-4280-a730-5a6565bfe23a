# Company Assessment Monorepo

This is an NX monorepo containing a NestJS backend and Angular frontend application.

## 🏗️ Project Structure

```
company-workspace/
├── apps/
│   ├── backend/              # NestJS API application
│   │   └── src/
│   │       ├── app/
│   │       │   ├── app.module.ts
│   │       │   ├── app.controller.ts
│   │       │   ├── app.service.ts
│   │       │   └── database.config.ts
│   │       └── main.ts
│   ├── frontend/             # Angular application
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       ├── styles.css    # TailwindCSS configured
│   │       └── main.ts
│   ├── backend-e2e/          # Backend E2E tests
│   └── frontend-e2e/         # Frontend E2E tests (Playwright)
├── tailwind.config.js        # TailwindCSS configuration
├── postcss.config.js         # PostCSS configuration
├── .env                      # Environment variables
└── .env.example              # Environment variables template
```

## 🚀 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript and JavaScript
- **SQLite** - Default database (development)
- **PostgreSQL** - Production database option

### Frontend
- **Angular** - Web application framework
- **TailwindCSS** - Utility-first CSS framework
- **Standalone Components** - Modern Angular architecture

### Monorepo Tools
- **NX** - Smart, fast and extensible build system
- **Jest** - Testing framework
- **Playwright** - E2E testing for frontend
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 Installation

```bash
# Install dependencies
npm install
```

## 🔧 Database Configuration

The backend supports both SQLite (default) and PostgreSQL. Configuration is managed through environment variables.

### Using SQLite (Default)
No additional setup required. The database file will be created automatically.

```bash
DB_TYPE=sqlite
```

### Using PostgreSQL
1. Update `.env` file:
```bash
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=company_db
```

2. Ensure PostgreSQL is running and the database exists.

## 🏃 Development

### Run Backend
```bash
# Development mode with watch
npx nx serve backend

# The API will be available at http://localhost:3000
```

### Run Frontend
```bash
# Development mode with watch
npx nx serve frontend

# The app will be available at http://localhost:4200
```

### Run Both Simultaneously
```bash
# Terminal 1
npx nx serve backend

# Terminal 2
npx nx serve frontend
```

## 🧪 Testing

### Unit Tests
```bash
# Test backend
npx nx test backend

# Test frontend
npx nx test frontend
```

### E2E Tests
```bash
# Test backend E2E
npx nx e2e backend-e2e

# Test frontend E2E
npx nx e2e frontend-e2e
```

## 🏗️ Building

### Build Backend
```bash
npx nx build backend

# Output: dist/apps/backend
```

### Build Frontend
```bash
npx nx build frontend

# Output: dist/apps/frontend
```

### Build All
```bash
npx nx run-many --target=build --all
```

## 📝 Creating New Features

### Generate a NestJS Module
```bash
npx nx g @nx/nest:module feature-name --project=backend
```

### Generate a NestJS Controller
```bash
npx nx g @nx/nest:controller feature-name --project=backend
```

### Generate a NestJS Service
```bash
npx nx g @nx/nest:service feature-name --project=backend
```

### Generate an Angular Component
```bash
npx nx g @nx/angular:component feature-name --project=frontend
```

### Generate an Angular Service
```bash
npx nx g @nx/angular:service feature-name --project=frontend
```

## 🗄️ TypeORM Entities

Create entity files in `apps/backend/src/app/`:

```typescript
// apps/backend/src/app/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}
```

Then register it in `database.config.ts` entities array.

## 🎨 TailwindCSS Usage

TailwindCSS is configured for the Angular frontend. Use utility classes in your templates:

```html
<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold text-blue-600">Hello World</h1>
  <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Click me
  </button>
</div>
```

## 📊 NX Commands

### View Project Graph
```bash
npx nx graph
```

### Run Affected Commands
```bash
# Test only affected projects
npx nx affected --target=test

# Build only affected projects
npx nx affected --target=build
```

### Clear Cache
```bash
npx nx reset
```

## 🔍 Code Quality

### Lint
```bash
# Lint backend
npx nx lint backend

# Lint frontend
npx nx lint frontend

# Lint all
npx nx run-many --target=lint --all
```

### Format
```bash
# Format all files
npx prettier --write .
```

## 📚 Additional Resources

- [NX Documentation](https://nx.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Angular Documentation](https://angular.dev)
- [TypeORM Documentation](https://typeorm.io)
- [TailwindCSS Documentation](https://tailwindcss.com)

## 🚀 Production Deployment

### Environment Variables
Ensure all required environment variables are set for production:

```bash
DB_TYPE=postgres
DB_HOST=your-production-host
DB_PORT=5432
DB_USER=your-production-user
DB_PASSWORD=your-production-password
DB_NAME=your-production-db
```

### Build for Production
```bash
npx nx build backend --configuration=production
npx nx build frontend --configuration=production
```

### Run Production Build
```bash
# Backend
node dist/apps/backend/main.js

# Frontend (serve with a static server)
npx serve dist/apps/frontend
```
