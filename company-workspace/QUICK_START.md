# Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js installed (v18 or higher)
- [ ] PostgreSQL installed and running
- [ ] Database `company_db` created

## Step-by-Step Setup

### 1. Check PostgreSQL is Running

```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# macOS (Homebrew):
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Windows:
# Start PostgreSQL from Services or pgAdmin
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE company_db;

# Exit
\q
```

### 3. Verify Environment Configuration

The `.env` file should already be configured. Verify it contains:

```bash
cat .env
```

Should show:
```
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=company_db

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

### 4. Start Backend

Open a terminal and run:

```bash
npx nx serve backend
```

**Expected output:**
```
🚀 Application is running on: http://localhost:3000/api
Admin user created: vindrajit1996@gmail.com
```

**Note:** The first time you run this, it will:
- Create the `users` table in PostgreSQL
- Seed the admin user automatically

### 5. Start Frontend

Open a **new terminal** (keep backend running) and run:

```bash
npx nx serve dashboard
```

**Expected output:**
```
Angular Live Development Server is listening on localhost:4200
```

Your browser should automatically open to `http://localhost:4200`

### 6. Test the Login

1. Browser should redirect to `/login`
2. Enter credentials:
   - **Email:** `vindrajit1996@gmail.com`
   - **Password:** `Admin@1234`
3. Click **Sign In**
4. You should be redirected to the dashboard
5. You should see:
   - Your email
   - Your role badge (ADMIN)
   - Role permissions
   - Logout button

**Success!** Authentication is working!

---

## Quick Test Checklist

### Frontend Tests

- [ ] Navigate to `http://localhost:4200`
- [ ] Redirected to `/login` (if not logged in)
- [ ] Can see login form
- [ ] Can log in with `vindrajit1996@gmail.com` / `Admin@1234`
- [ ] Redirected to dashboard after login
- [ ] Can see user email and role on dashboard
- [ ] Can logout successfully
- [ ] After logout, redirected back to `/login`

### Backend Tests (using curl)

```bash
# Test 1: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vindrajit1996@gmail.com","password":"Admin@1234"}'

# Copy the access_token from the response above, then:

# Test 2: Access protected profile route
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test 3: Access admin route (should work for ADMIN)
curl http://localhost:3000/api/admin \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test 4: Access owner route (should return 403 for ADMIN)
curl http://localhost:3000/api/owner \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected results:
- ✅ Login returns token and user object
- ✅ Profile route returns user data
- ✅ Admin route returns admin data
- ❌ Owner route returns 403 Forbidden (because user is ADMIN, not OWNER)

---

## Troubleshooting

### Problem: Backend won't start

**Error:** "Connection refused" or "ECONNREFUSED"

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# If not, start it
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

---

### Problem: "database does not exist"

**Solution:**
```bash
psql -U postgres -c "CREATE DATABASE company_db;"
```

---

### Problem: "password authentication failed"

**Solution:**
Check PostgreSQL password in `.env` file matches your PostgreSQL setup:
```bash
# Test connection
psql -U postgres -d company_db

# If password is different, update .env file:
DB_PASSWORD=your_actual_password
```

---

### Problem: Frontend shows "Connection refused"

**Solution:**
- Ensure backend is running on port 3000
- Check console for CORS errors
- Verify `http://localhost:3000/api` is accessible

---

### Problem: Login fails with correct credentials

**Solutions:**
1. Check backend logs for errors
2. Verify user was seeded:
   ```bash
   psql -U postgres -d company_db -c "SELECT email, role FROM users;"
   ```
3. Restart backend to trigger seeding again

---

### Problem: Port already in use

**Backend (port 3000):**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

**Frontend (port 4200):**
```bash
# Find process using port 4200
lsof -ti:4200

# Kill the process
kill -9 $(lsof -ti:4200)
```

---

## Default User Credentials

| Email | Password | Role |
|-------|----------|------|
| vindrajit1996@gmail.com | Admin@1234 | ADMIN |

This user is automatically created when the backend starts.

---

## What to Test

### Role-Based Access Control (RBAC)

The system has 3 roles:

1. **OWNER** - Full access
   - Can access all endpoints
   - Highest privilege level

2. **ADMIN** - Administrative access (default seeded user)
   - Can access most endpoints
   - Cannot access OWNER-only endpoints

3. **VIEWER** - Read-only access
   - Can only view, not modify
   - Most restricted access

### Protected Routes

1. `/api/profile` - Any authenticated user
2. `/api/admin` - ADMIN or OWNER only
3. `/api/owner` - OWNER only

Try accessing these with the default ADMIN user to see RBAC in action!

---

## Next Steps

After confirming everything works:

1. **Read the full documentation:**
   - [`AUTH_IMPLEMENTATION.md`](./AUTH_IMPLEMENTATION.md) - Detailed implementation guide
   - [`API_REFERENCE.md`](./API_REFERENCE.md) - Complete API documentation

2. **Create additional users:**
   - Edit `apps/api/src/app/seed.service.ts`
   - Add more users with different roles
   - Restart backend to apply

3. **Add new protected routes:**
   - See examples in `apps/api/src/app/app.controller.ts`
   - Use `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles()` decorator

4. **Customize the UI:**
   - Update `apps/dashboard/src/app/login/login.component.html`
   - Update `apps/dashboard/src/app/dashboard/dashboard.component.html`

5. **Production deployment:**
   - Change `JWT_SECRET` in `.env`
   - Enable HTTPS
   - Add rate limiting
   - Use environment-specific configs

---

## Development Commands

```bash
# Start backend
npx nx serve backend

# Start frontend
npx nx serve dashboard

# Build backend
npx nx build backend

# Build frontend
npx nx build dashboard

# Run tests
npx nx test backend
npx nx test dashboard

# Lint
npx nx lint backend
npx nx lint dashboard
```

---

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review backend logs in the terminal
3. Check browser console for frontend errors
4. Verify PostgreSQL is running and accessible
5. Review the full documentation in `AUTH_IMPLEMENTATION.md`

---

## Quick Reference

**Backend URL:** `http://localhost:3000/api`
**Frontend URL:** `http://localhost:4200`
**Login endpoint:** `POST http://localhost:3000/api/auth/login`
**Default user:** `vindrajit1996@gmail.com` / `Admin@1234`

Happy coding!
