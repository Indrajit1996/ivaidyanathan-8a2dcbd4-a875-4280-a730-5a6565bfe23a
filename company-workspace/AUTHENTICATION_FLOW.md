# Authentication Flow Documentation

## Overview

The authentication system automatically handles user sessions using localStorage and route guards.

## How It Works

### On Page Load

When the Angular application loads, it automatically:

1. **Checks localStorage** for `access_token` and `currentUser`
2. **Initializes AuthService** with stored user data (if available)
3. **Applies route guards** to determine navigation:
   - If token exists → Redirect to dashboard (`/`)
   - If no token → Redirect to login (`/login`)

### Route Guards

#### 1. Auth Guard (for protected routes)
**File:** `apps/dashboard/src/app/auth/auth.guard.ts`

**Applied to:** Dashboard and all protected pages

**Behavior:**
- ✅ Token exists → Allow access
- ❌ No token → Redirect to `/login`

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
```

#### 2. Login Guard (for login page)
**File:** `apps/dashboard/src/app/auth/login.guard.ts`

**Applied to:** Login page

**Behavior:**
- ✅ No token → Allow access to login
- ❌ Token exists → Redirect to `/` (dashboard)

```typescript
export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already authenticated, redirect to dashboard
  if (authService.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }

  // Otherwise, allow access to login page
  return true;
};
```

## Authentication Flow Diagrams

### Initial Page Load

```
┌─────────────────────────────────────────────┐
│        User Opens Application               │
│          (any URL)                          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Angular App Initializes                   │
│   AuthService Constructor Runs              │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Check localStorage for:                    │
│  - access_token                             │
│  - currentUser                              │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
   ┌──────────┐         ┌──────────┐
   │  Found   │         │Not Found │
   └────┬─────┘         └────┬─────┘
        │                    │
        ▼                    ▼
┌──────────────┐      ┌──────────────┐
│ User tries   │      │ User tries   │
│ to access    │      │ to access    │
│ any route    │      │ any route    │
└──────┬───────┘      └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ Route Guard  │      │ Route Guard  │
│ Checks Auth  │      │ Checks Auth  │
└──────┬───────┘      └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ Redirect to  │      │ Redirect to  │
│ Dashboard    │      │ /login       │
│ (/)          │      │              │
└──────────────┘      └──────────────┘
```

### Login Flow

```
┌─────────────────────────────────────────────┐
│   User at /login Page                       │
│   Enters credentials                        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Submit Login Form                         │
│   authService.login(email, password)        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   POST /api/auth/login                      │
│   Backend validates credentials             │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
   ┌──────────┐         ┌──────────┐
   │ Success  │         │  Failed  │
   └────┬─────┘         └────┬─────┘
        │                    │
        ▼                    ▼
┌──────────────────┐   ┌──────────────┐
│ Returns:         │   │ Show Error   │
│ - access_token   │   │ Message      │
│ - user object    │   │              │
└────┬─────────────┘   └──────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ AuthService stores in localStorage:  │
│ - access_token                       │
│ - currentUser (JSON)                 │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Update currentUserSubject            │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Router navigates to /                │
│ (Dashboard)                          │
└──────────────────────────────────────┘
```

### Logout Flow

```
┌───────────��─────────────────────────────────┐
│   User Clicks Logout Button                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   authService.logout()                      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Remove from localStorage:                 │
│   - access_token                            │
│   - currentUser                             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Set currentUserSubject to null            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Router navigates to /login                │
└─────────────────────────────────────────────┘
```

### Protected Route Access

```
┌─────────────────────────────────────────────┐
│   User Navigates to Protected Route         │
│   (e.g., /dashboard, /admin, etc.)          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   authGuard runs                            │
│   Checks: authService.isAuthenticated()     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Check localStorage for access_token       │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
   ┌──────────┐         ┌──────────┐
   │  Exists  │         │Not Found │
   └────┬─────┘         └────┬─────┘
        │                    │
        ▼                    ▼
┌──────────────┐      ┌──────────────┐
│ Allow Access │      │ Redirect to  │
│ to Route     │      │ /login       │
└──────────────┘      └──────────────┘
```

### Accessing Login Page When Already Logged In

```
┌─────────────────────────────────────────────┐
│   Logged-in User Navigates to /login        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   loginGuard runs                           │
│   Checks: authService.isAuthenticated()     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Check localStorage for access_token       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Token Exists → User is authenticated      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Redirect to / (Dashboard)                 │
│   (Prevent access to login page)            │
└─────────────────────────────────────────────┘
```

## localStorage Keys

### access_token
- **Type:** String (JWT token)
- **Example:** `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
- **Used for:** API authentication via HTTP interceptor

### currentUser
- **Type:** JSON string
- **Example:** `{"id":"uuid","email":"user@example.com","role":"ADMIN"}`
- **Used for:** Display user info, check roles in UI

## Code References

### Route Configuration
**File:** `apps/dashboard/src/app/app.routes.ts`

```typescript
export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]  // Redirects authenticated users to dashboard
  },
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]  // Redirects unauthenticated users to login
  },
  {
    path: '**',
    redirectTo: ''
  }
];
```

### AuthService Initialization
**File:** `apps/dashboard/src/app/auth/auth.service.ts`

```typescript
constructor(private http: HttpClient) {
  // Load user from localStorage on app initialization
  const storedUser = localStorage.getItem('currentUser');
  this.currentUserSubject = new BehaviorSubject<User | null>(
    storedUser ? JSON.parse(storedUser) : null
  );
  this.currentUser = this.currentUserSubject.asObservable();
}

isAuthenticated(): boolean {
  const token = this.getToken();
  return !!token;  // Returns true if token exists
}
```

## User Scenarios

### Scenario 1: New User (No Token)
1. Opens `http://localhost:4200`
2. No token in localStorage
3. AuthGuard redirects to `/login`
4. User sees login form
5. After login → Redirected to `/` (dashboard)

### Scenario 2: Returning User (Has Token)
1. Opens `http://localhost:4200`
2. Token found in localStorage
3. AuthService initializes with stored user
4. AuthGuard allows access
5. User sees dashboard immediately

### Scenario 3: Logged-in User Tries to Access Login
1. User is logged in (token in localStorage)
2. User navigates to `/login`
3. LoginGuard checks authentication
4. Finds token → Redirects to `/`
5. User stays on dashboard

### Scenario 4: Session Expires or Token Removed
1. User is on dashboard
2. Token gets removed/expired
3. User clicks any protected route
4. AuthGuard checks → No valid token
5. Redirects to `/login`

## Testing the Flow

### Test 1: Fresh User
```bash
# Clear localStorage
localStorage.clear()

# Navigate to app
# Expected: Redirect to /login
```

### Test 2: After Login
```bash
# Login successfully
# Check localStorage
console.log(localStorage.getItem('access_token'))
console.log(localStorage.getItem('currentUser'))

# Try to access /login
# Expected: Redirect to /
```

### Test 3: Logout
```bash
# Click logout
# Check localStorage
console.log(localStorage.getItem('access_token'))  // null
console.log(localStorage.getItem('currentUser'))   // null

# Expected: Redirect to /login
```

### Test 4: Manual Token Removal
```bash
# While on dashboard
localStorage.removeItem('access_token')

# Try to navigate
# Expected: Redirect to /login
```

## Security Considerations

1. **Token Storage:** JWT tokens are stored in localStorage
   - ✅ Survives page refreshes
   - ⚠️ Accessible to JavaScript (XSS risk)
   - 💡 Consider httpOnly cookies for production

2. **Token Validation:** Client-side validation is basic
   - ✅ Checks if token exists
   - ⚠️ Doesn't validate expiration client-side
   - 💡 Backend validates on each request

3. **Guard Protection:** Routes are protected but not foolproof
   - ✅ Prevents UI access
   - ⚠️ API can still be called directly
   - 💡 Backend also validates all requests

## Best Practices Implemented

✅ Guards check authentication on every route change
✅ User data loaded from localStorage on app init
✅ Automatic redirect based on auth state
✅ Logout clears all auth data
✅ Login page inaccessible when logged in
✅ Protected routes require authentication

## Future Enhancements

1. **Token Refresh:** Implement refresh token mechanism
2. **Expiration Check:** Validate token expiration client-side
3. **Auto-Logout:** Logout on token expiration
4. **Session Timeout:** Logout after inactivity
5. **Remember Me:** Optional persistent sessions
6. **Multi-Tab Sync:** Sync auth state across tabs
