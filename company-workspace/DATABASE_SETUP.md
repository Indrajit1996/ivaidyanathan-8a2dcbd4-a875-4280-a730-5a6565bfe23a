# PostgreSQL Database Setup Guide

## ✅ Current Status

Your PostgreSQL is already set up and running! The `company_db` database has been created.

## How to Connect Backend to Database

### Step 1: Verify PostgreSQL is Running

```bash
pg_isready
```

Expected output: `/tmp:5432 - accepting connections`

### Step 2: Check Database Exists

```bash
psql -U postgres -l | grep company_db
```

You should see `company_db` in the list.

### Step 3: Start the Backend

```bash
npx nx serve backend
```

The backend will:
1. Connect to PostgreSQL on `localhost:5432`
2. Use database `company_db`
3. Automatically create the `users` table
4. Seed the admin user (`vindrajit1996@gmail.com`)
5. Start the API on `http://localhost:3000/api`

Expected output:
```
🚀 Application is running on: http://localhost:3000/api
Admin user created: vindrajit1996@gmail.com
```

### Step 4: Start the Frontend (in a new terminal)

```bash
npx nx serve dashboard
```

The frontend will start on `http://localhost:4200`

## Database Connection Details

The backend connects using these settings from `.env`:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=company_db
```

## Useful PostgreSQL Commands

### Connect to the database
```bash
psql -U postgres -d company_db
```

### List all tables
```sql
\dt
```

### View users table
```sql
SELECT email, role, "createdAt" FROM users;
```

### Exit psql
```sql
\q
```

### Check if PostgreSQL is running
```bash
pg_isready
```

### Start PostgreSQL (if not running)
```bash
brew services start postgresql
```

### Stop PostgreSQL
```bash
brew services stop postgresql
```

### Restart PostgreSQL
```bash
brew services restart postgresql
```

## Troubleshooting

### Problem: "database does not exist"

**Solution:**
```bash
createdb -U postgres company_db
```

### Problem: "connection refused"

**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql

# Wait a few seconds, then verify
pg_isready
```

### Problem: "password authentication failed"

**Solution:**
The default password is `postgres`. If you changed it, update `.env`:
```env
DB_PASSWORD=your_password_here
```

### Problem: "role 'postgres' does not exist"

**Solution:**
```bash
# Create postgres user
createuser -s postgres
```

## Verify Everything is Working

### 1. Check database connection
```bash
psql -U postgres -d company_db -c "SELECT version();"
```

### 2. Check tables after backend starts
```bash
psql -U postgres -d company_db -c "\dt"
```

You should see a `users` table.

### 3. Check seeded admin user
```bash
psql -U postgres -d company_db -c "SELECT email, role FROM users;"
```

You should see:
```
         email          | role
------------------------+-------
 vindrajit1996@gmail.com | ADMIN
```

## Next Steps

1. ✅ PostgreSQL is running
2. ✅ Database `company_db` exists
3. ▶️ Start backend: `npx nx serve backend`
4. ▶️ Start frontend: `npx nx serve dashboard` (in new terminal)
5. 🌐 Open browser: `http://localhost:4200`
6. 🔐 Login with: `vindrajit1996@gmail.com` / `Admin@1234`

## Database Schema

After the backend starts, TypeORM will automatically create this table:

### users table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | varchar | Unique email address |
| password | varchar | Bcrypt hashed password |
| role | varchar | OWNER, ADMIN, or VIEWER |
| createdAt | timestamp | Creation timestamp |
| updatedAt | timestamp | Last update timestamp |

## Reset Database (if needed)

If you need to start fresh:

```bash
# Drop and recreate database
dropdb -U postgres company_db
createdb -U postgres company_db

# Restart backend to recreate tables and seed data
npx nx serve backend
```

## Production Considerations

For production deployment:

1. **Change default credentials** in `.env`:
   ```env
   DB_USER=your_production_user
   DB_PASSWORD=strong_password_here
   JWT_SECRET=generate_random_secret_key
   ```

2. **Disable TypeORM synchronize** in `database.config.ts`:
   ```typescript
   synchronize: false, // Use migrations instead
   ```

3. **Use migrations** instead of auto-sync:
   ```bash
   npm install -g typeorm
   typeorm migration:generate -n InitialMigration
   typeorm migration:run
   ```

4. **Use environment variables** for sensitive data
5. **Enable SSL** for database connections
6. **Set up backups** and monitoring
