# Database Seeding Guide

## Overview
Automatic database seeding is configured to run when the backend server starts, ensuring the database is populated with initial data including organizations and users.

## How It Works

### Automatic Seeding (Default)
The database is **automatically seeded** every time the backend server starts:

```bash
# Start the backend server (seeding runs automatically)
npx nx serve api
```

**What happens:**
1. Server starts and connects to database
2. `SeedService.onModuleInit()` is called automatically by NestJS
3. Database is checked for existing data
4. Missing organizations and users are created
5. Server continues to start normally

### Seeding Process

The seed process runs in this order:

#### 1. Organization Seeding
- Creates "Default Organization" if it doesn't exist
- All users will be assigned to this organization
- Idempotent: Won't recreate if already exists

#### 2. User Seeding
Creates 3 default users with different roles:

| Email | Password | Role | Name |
|-------|----------|------|------|
| `vindrajit1996@gmail.com` | `Admin@1234` | **ADMIN** | Vindrajit Admin |
| `chrisKaram@gmail.com` | `Admin@1234` | **OWNER** | Chris Karam |
| `testuser@gmail.com` | `Admin@1234` | **VIEWER** | Test Viewer |

**Features:**
- Idempotent: Won't recreate existing users
- Auto-assigns users to organization
- Updates users missing organization assignment
- Passwords are bcrypt-hashed for security

## Manual Seeding

You can also run the seed script manually:

### Run Seed Script
```bash
# Run seeding manually (from workspace root)
npx nx seed api

# Force mode (not yet implemented)
npx nx seed:force api
```

## Environment Control

### Disable Auto-Seeding

To disable automatic seeding when the server starts:

```bash
# Set environment variable
export AUTO_SEED=false

# Or in .env file
AUTO_SEED=false

# Then start server
npx nx serve api
```

### Enable Auto-Seeding (Default)

Auto-seeding is enabled by default. To explicitly enable:

```bash
# Set environment variable (or omit for default)
export AUTO_SEED=true

# Or in .env file
AUTO_SEED=true
```

## Logging Output

The seed process provides detailed logging:

### Successful Seeding (First Run)
```
[SeedService] 🌱 Starting database seeding...
[SeedService]    ✓ Organization created: Default Organization
[SeedService]    ✓ User created: vindrajit1996@gmail.com (ADMIN)
[SeedService]    ✓ User created: chrisKaram@gmail.com (OWNER)
[SeedService]    ✓ User created: testuser@gmail.com (VIEWER)
[SeedService]    📊 Summary: 3 created, 0 updated, 0 existing
[SeedService] ✅ Database seeding completed successfully
```

### Subsequent Runs (Data Exists)
```
[SeedService] 🌱 Starting database seeding...
[SeedService]    ✓ Organization already exists: Default Organization
[SeedService]    ○ User already exists: vindrajit1996@gmail.com
[SeedService]    ○ User already exists: chrisKaram@gmail.com
[SeedService]    ○ User already exists: testuser@gmail.com
[SeedService]    📊 Summary: 0 created, 0 updated, 3 existing
[SeedService] ✅ Database seeding completed successfully
```

### Disabled Seeding
```
[SeedService] 🌱 Auto-seeding is disabled (AUTO_SEED=false)
```

### Seeding Error
```
[SeedService] 🌱 Starting database seeding...
[SeedService] ❌ Database seeding failed: Connection timeout
```

## Implementation Details

### File Structure
```
apps/api/src/
├── app/
│   ├── app.module.ts           # Registers SeedService
│   └── seed.service.ts         # Main seeding logic (auto-runs)
└── seed.ts                     # Standalone seed script (manual)
```

### SeedService Class
**Location:** `apps/api/src/app/seed.service.ts`

```typescript
@Injectable()
export class SeedService implements OnModuleInit {
  async onModuleInit() {
    // Runs automatically when AppModule initializes
    if (process.env.AUTO_SEED !== 'false') {
      await this.seedDatabase();
    }
  }

  async seedDatabase() {
    await this.seedOrganization();
    await this.seedUsers();
  }
}
```

### Key Features

1. **Idempotent:** Safe to run multiple times
2. **Non-Destructive:** Never deletes existing data
3. **Smart Updates:** Assigns organization to users missing it
4. **Error Handling:** Catches and logs errors without crashing
5. **Environment Control:** Can be disabled via `AUTO_SEED=false`
6. **Professional Logging:** Clear, colorful output with emojis

## Customizing Seed Data

### Add More Users

Edit `apps/api/src/app/seed.service.ts`:

```typescript
const usersToSeed = [
  // Existing users...
  {
    email: 'newuser@example.com',
    password: 'SecurePassword123!',
    role: UserRole.ADMIN,
    name: 'New User Name',
  },
];
```

### Add More Organizations

Edit the `seedOrganization()` method:

```typescript
private async seedOrganization() {
  const orgsToSeed = [
    { name: 'Default Organization', description: 'Main org' },
    { name: 'Test Organization', description: 'Test org' },
  ];

  for (const orgData of orgsToSeed) {
    // Check if exists...
    // Create if not...
  }
}
```

### Seed Other Entities

Add new methods to `SeedService`:

```typescript
async seedDatabase() {
  await this.seedOrganization();
  await this.seedUsers();
  await this.seedTasks();        // New
  await this.seedProjects();     // New
}

private async seedTasks() {
  // Your task seeding logic
}
```

## Testing

### Test Auto-Seeding

1. **Drop Database:**
   ```bash
   # Using PostgreSQL
   psql -U postgres -c "DROP DATABASE company_assessment;"
   psql -U postgres -c "CREATE DATABASE company_assessment;"
   ```

2. **Start Server:**
   ```bash
   npx nx serve api
   ```

3. **Check Logs:**
   Should see "Organization created" and "User created" messages

4. **Restart Server:**
   ```bash
   # Stop with Ctrl+C, then restart
   npx nx serve api
   ```

5. **Check Logs Again:**
   Should see "already exists" messages (idempotent)

### Test Manual Seeding

```bash
# Run manual seed
npx nx seed api

# Check output for success
```

### Test Disabled Seeding

```bash
# Disable seeding
export AUTO_SEED=false

# Start server
npx nx serve api

# Should see "Auto-seeding is disabled" message
```

## Troubleshooting

### Seeding Doesn't Run

**Problem:** Server starts but no seed logs appear

**Solutions:**
1. Check `AUTO_SEED` environment variable is not `false`
2. Verify `SeedService` is in `AppModule` providers
3. Check database connection is working

### Users Not Created

**Problem:** Organization created but users missing

**Solutions:**
1. Check database logs for constraint violations
2. Verify email addresses are unique
3. Check password hashing is working (bcrypt installed)

### Duplicate Key Errors

**Problem:** Error about duplicate key violations

**Solution:**
- This is normal and handled by the code
- Users won't be recreated if they already exist
- Check logs for "already exists" messages

## Production Considerations

### Security

1. **Change Default Passwords:**
   ```typescript
   // In production, use environment variables
   password: process.env.ADMIN_PASSWORD || 'Admin@1234',
   ```

2. **Disable Auto-Seeding in Production:**
   ```bash
   # Production environment
   AUTO_SEED=false
   ```

3. **Secure Seed Script:**
   - Don't commit passwords to git
   - Use environment variables
   - Rotate passwords after seeding

### Best Practices

1. **Run Once:** Disable auto-seed after initial setup
2. **Manual Control:** Use standalone script for production
3. **Audit:** Log all seeding operations
4. **Backup:** Backup database before seeding
5. **Test:** Test seeding in staging before production

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npx nx serve api` | Start server (auto-seeds by default) |
| `npx nx seed api` | Run seed script manually |
| `npx nx seed:force api` | Force re-seed (future feature) |
| `AUTO_SEED=false npx nx serve api` | Start without seeding |

## Files Modified

- ✅ `apps/api/src/app/seed.service.ts` - Enhanced with logging and error handling
- ✅ `apps/api/src/seed.ts` - New standalone seed script
- ✅ `apps/api/project.json` - Added seed commands
- ✅ `DATABASE_SEEDING_GUIDE.md` - This documentation

## Status

✅ **Auto-seeding is fully functional**
✅ **Manual seeding script available**
✅ **Environment-based control implemented**
✅ **Professional logging added**
✅ **Documentation complete**

---

**Implementation Date:** October 17, 2025
**Status:** Production-Ready
