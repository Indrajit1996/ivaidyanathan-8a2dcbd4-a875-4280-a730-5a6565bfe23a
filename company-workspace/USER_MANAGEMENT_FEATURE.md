# User Management Feature

## Overview
A comprehensive user management page that allows viewing all users in the organization, with delete functionality restricted to OWNER role only. OWNER cannot delete themselves.

## Implementation Details

### Backend (NestJS)

#### Files Created:
1. **[users.controller.ts](apps/api/src/app/users/users.controller.ts)** - Handles HTTP requests
2. **[users.service.ts](apps/api/src/app/users/users.service.ts)** - Business logic for user operations
3. **[users.module.ts](apps/api/src/app/users/users.module.ts)** - Module configuration

#### API Endpoints:

**GET /api/users**
- Lists all users in the organization
- Accessible by: OWNER, ADMIN, VIEWER (all authenticated users can view)
- Returns user profiles with email, name, role, and timestamps

**DELETE /api/users/:id**
- Deletes a specific user
- Accessible by: OWNER only (enforced by `@Roles(UserRole.OWNER)`)
- Prevents self-deletion
- Validates that the user being deleted is in the same organization

### Frontend (Angular)

#### Files Created:
1. **[users.component.ts](apps/dashboard/src/app/users/users.component.ts)** - Component logic
2. **[users.component.html](apps/dashboard/src/app/users/users.component.html)** - Template
3. **[users.component.css](apps/dashboard/src/app/users/users.component.css)** - Styling
4. **[user.service.ts](apps/dashboard/src/app/services/user.service.ts)** - API service

#### Files Modified:
1. **[app.routes.ts](apps/dashboard/src/app/app.routes.ts)** - Added `/users` route
2. **[app.module.ts](apps/api/src/app/app.module.ts)** - Imported UsersModule
3. **[dashboard.component.html](apps/dashboard/src/app/dashboard/dashboard.component.html)** - Added "Users" navigation button

## Features

### Role-Based Access Control (RBAC)

#### OWNER
✅ Can view all users in the organization
✅ Can delete any user (except themselves)
✅ Delete button is enabled for all users except themselves

#### ADMIN
✅ Can view all users in the organization
❌ Cannot delete users (no delete button shown)
ℹ️ Shows "OWNER only" message in actions column

#### VIEWER
✅ Can view all users in the organization
❌ Cannot delete users (no delete button shown)
ℹ️ Shows "OWNER only" message in actions column

### Self-Deletion Prevention

The system prevents OWNER from deleting themselves through multiple layers:

1. **Frontend validation**: Delete button shows "Cannot delete yourself" for current user
2. **Backend validation**: API returns 403 Forbidden if attempting self-deletion
3. **UI feedback**: Current user's row is highlighted with a light blue background

### User Interface

#### Header Section
- Page title: "User Management"
- "Back to Dashboard" button
- "Logout" button

#### Current User Info Card
- Displays logged-in user's email
- Shows current user's role with color-coded badge

#### Users Table
Displays:
- Email (with "You" tag for current user)
- Name
- Role (color-coded badge)
- Join date (formatted)
- Actions column (context-aware based on permissions)

#### Visual Indicators
- **Role Badges**:
  - OWNER: Purple badge
  - ADMIN: Blue badge
  - VIEWER: Green badge
- **Current User**: Light blue row highlight + "(You)" tag
- **Loading State**: Spinner animation
- **Success/Error Messages**: Colored alert boxes

## Security Features

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Role Guards**: Delete endpoint protected by `@Roles(UserRole.OWNER)`
3. **Organization Scoping**: Users can only see/delete users in their own organization
4. **Self-Deletion Prevention**: Multiple layers prevent accidental self-deletion
5. **Permission Validation**: Backend validates permissions before executing operations

## Usage

### Accessing the Page
1. Log in to the dashboard
2. Click the "Users" button in the top navigation
3. View the list of all users in your organization

### Deleting a User (OWNER only)
1. Navigate to the Users page
2. Find the user you want to delete
3. Click the "Delete" button in the Actions column
4. Confirm the deletion in the popup dialog
5. User is removed from the list upon successful deletion

## API Examples

### Get All Users
```bash
GET http://localhost:3000/api/users
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

### Delete User (OWNER only)
```bash
DELETE http://localhost:3000/api/users/{userId}
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "User deleted successfully",
  "deletedUserId": "uuid"
}

Error Cases:
- 403 Forbidden: If not OWNER or attempting self-deletion
- 404 Not Found: If user doesn't exist
- 403 Forbidden: If user is in different organization
```

## Error Handling

The system handles various error scenarios:
- **Not authenticated**: Redirected to login
- **Insufficient permissions**: Error message displayed
- **User not found**: 404 error with message
- **Self-deletion attempt**: "You cannot delete yourself" message
- **Network errors**: Generic error message with retry option

## Testing Checklist

- [ ] OWNER can view all users
- [ ] OWNER can delete other users
- [ ] OWNER cannot delete themselves
- [ ] ADMIN can view all users
- [ ] ADMIN cannot delete users
- [ ] VIEWER can view all users
- [ ] VIEWER cannot delete users
- [ ] Current user's row is highlighted
- [ ] Delete confirmation dialog appears
- [ ] Success message shows after deletion
- [ ] User list updates after deletion
- [ ] Error messages display correctly
- [ ] Navigation works correctly
