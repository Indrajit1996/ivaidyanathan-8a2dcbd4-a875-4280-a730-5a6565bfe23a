# API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication Endpoints

### Login
Authenticate a user and receive a JWT token.

**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "vindrajit1996@gmail.com",
    "role": "ADMIN",
    "createdAt": "2025-10-16T00:00:00.000Z",
    "updatedAt": "2025-10-16T00:00:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vindrajit1996@gmail.com",
    "password": "Admin@1234"
  }'
```

---

## Protected Endpoints

All protected endpoints require the JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Get Profile
Get current user's profile information.

**Endpoint:** `GET /profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "message": "This is a protected route",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "vindrajit1996@gmail.com",
    "role": "ADMIN"
  }
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Example:**
```bash
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Get Admin Data
Access admin-only data (requires ADMIN or OWNER role).

**Endpoint:** `GET /admin`

**Required Roles:** `ADMIN`, `OWNER`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "message": "This route is only accessible to ADMIN and OWNER roles",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "vindrajit1996@gmail.com",
    "role": "ADMIN"
  },
  "data": "Sensitive admin data"
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Error Response (403):**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Get Owner Data
Access owner-only data (requires OWNER role).

**Endpoint:** `GET /owner`

**Required Roles:** `OWNER`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "message": "This route is only accessible to OWNER role",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "owner@example.com",
    "role": "OWNER"
  },
  "data": "Super sensitive owner data"
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Error Response (403):**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

**Example:**
```bash
curl http://localhost:3000/api/owner \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## User Roles

| Role | Level | Description |
|------|-------|-------------|
| `OWNER` | 3 | Highest level, full system access |
| `ADMIN` | 2 | Administrative access, can manage most resources |
| `VIEWER` | 1 | Read-only access, cannot modify resources |

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions (wrong role) |
| 500 | Internal Server Error | Server error |

---

## Testing with Postman

### 1. Create a Login Request

1. Create new request: `POST http://localhost:3000/api/auth/login`
2. Set Headers:
   - `Content-Type: application/json`
3. Set Body (raw JSON):
   ```json
   {
     "email": "vindrajit1996@gmail.com",
     "password": "Admin@1234"
   }
   ```
4. Send request
5. Copy the `access_token` from response

### 2. Create Protected Request

1. Create new request: `GET http://localhost:3000/api/profile`
2. Set Headers:
   - `Authorization: Bearer <paste_access_token_here>`
3. Send request

### 3. Save Token to Environment

1. In login request, add to Tests tab:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("access_token", jsonData.access_token);
   ```
2. In protected requests, use:
   - `Authorization: Bearer {{access_token}}`

---

## Testing with JavaScript/TypeScript

```typescript
// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'vindrajit1996@gmail.com',
    password: 'Admin@1234',
  }),
});

const { access_token, user } = await loginResponse.json();

// Access protected route
const profileResponse = await fetch('http://localhost:3000/api/profile', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
  },
});

const profile = await profileResponse.json();
console.log(profile);
```

---

## Rate Limiting (Recommended for Production)

Consider adding rate limiting to prevent abuse:

```bash
npm install @nestjs/throttler
```

In `app.module.ts`:
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    // ... other imports
  ],
})
```

---

## JWT Token Structure

The JWT token contains:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "email": "vindrajit1996@gmail.com",
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "role": "ADMIN",
  "iat": 1634567890,
  "exp": 1634654290
}
```

- `sub`: User ID
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (24h from issue)

You can decode tokens at: https://jwt.io (for debugging only, never share production tokens!)
