# Dashboard API Integration - Summary

## Overview

The dashboard component has been successfully integrated with the backend RBAC API. All task operations now communicate with the NestJS backend with proper authentication and authorization.

---

## API Endpoints Integrated

### ✅ 1. POST /tasks – Create Task
**Location**: `dashboard.component.ts` - `createTask()` method (line 266-296)

**Features**:
- Creates new task with title, description, priority, status, and due date
- Requires valid JWT token
- Permission check on backend (all roles can create tasks)
- Automatically assigns task to current user's organization
- Shows error message if user lacks permission

**Usage**:
```typescript
this.taskService.createTask(taskData).subscribe({
  next: (task) => {
    // Task created successfully
  },
  error: (error) => {
    // Handle permission or validation errors
  }
});
```

---

### ✅ 2. GET /tasks – List Accessible Tasks
**Location**: `dashboard.component.ts` - `loadTasks()` method (line 72-88)

**Features**:
- Loads all tasks visible to current user
- **OWNER/ADMIN**: See all tasks in organization
- **VIEWER**: See only own tasks or tasks assigned to them
- Automatically called on component initialization
- Tasks organized by status (TODO, IN_PROGRESS, COMPLETED)

**Usage**:
```typescript
this.taskService.getAllTasks().subscribe({
  next: (tasks) => {
    // Process and display tasks
  },
  error: (error) => {
    // Handle authentication or permission errors
  }
});
```

---

### ✅ 3. PUT /tasks/:id – Edit Task
**Location**: `dashboard.component.ts` - `updateTask()` method (line 301-335)

**Features**:
- Updates task properties (title, description, priority, status, due date)
- **OWNER/ADMIN**: Can update any task in organization
- **VIEWER**: Can only update own tasks
- Backend validates ownership and permissions
- Drag-and-drop also triggers task update (line 158-196)

**Usage**:
```typescript
this.taskService.updateTask(taskId, updateData).subscribe({
  next: (updatedTask) => {
    // Task updated successfully
  },
  error: (error) => {
    // Handle permission errors
  }
});
```

---

### ✅ 4. DELETE /tasks/:id – Delete Task
**Location**: `dashboard.component.ts` - `deleteTask()` method (line 340-366)

**Features**:
- Deletes task with confirmation dialog
- **OWNER/ADMIN**: Can delete any task in organization
- **VIEWER**: Can only delete own tasks
- Backend validates ownership before deletion
- Shows permission error if access denied

**Usage**:
```typescript
this.taskService.deleteTask(taskId).subscribe({
  next: () => {
    // Task deleted successfully
  },
  error: (error) => {
    // Handle permission errors
  }
});
```

---

### ⚠️ 5. GET /audit-log – View Access Logs
**Location**: `task.service.ts` - `getAuditLogs()` method (line 132-153)

**Status**: Service method created, **backend endpoint needs to be added**

**Planned Features**:
- View all audit logs (OWNER/ADMIN only)
- Filter by user, action, resource, date range
- Pagination support

**Note**: To enable this feature, add an audit logs controller endpoint in the backend:
```typescript
// Backend: apps/api/src/app/audit-logs/audit-logs.controller.ts (needs to be created)
@Get('audit-logs')
@RequirePermissions(Permission.ORG_MANAGE)
getAuditLogs(@Query() filters) {
  return this.auditLogService.getAuditLogs(filters);
}
```

---

## Key Components Created

### 1. Task Service (`task.service.ts`)
**Location**: `apps/dashboard/src/app/services/task.service.ts`

**Responsibilities**:
- HTTP communication with backend API
- JWT token management
- Type-safe interfaces for Task, CreateTaskDto, UpdateTaskDto
- Audit log retrieval (when backend endpoint added)

**Key Methods**:
- `createTask(taskData: CreateTaskDto)` - POST /tasks
- `getAllTasks()` - GET /tasks
- `getTaskById(taskId)` - GET /tasks/:id
- `getTasksByStatus(status)` - GET /tasks/status/:status
- `updateTask(taskId, updateData)` - PATCH /tasks/:id
- `deleteTask(taskId)` - DELETE /tasks/:id
- `getAuditLogs(filters)` - GET /audit-logs (pending backend)

**Authentication**:
```typescript
private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('access_token');
  return new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });
}
```

---

### 2. Updated Dashboard Component (`dashboard.component.ts`)
**Location**: `apps/dashboard/src/app/dashboard/dashboard.component.ts`

**Changes from Original**:
- ✅ Replaced hardcoded tasks with API calls
- ✅ Added loading and error states
- ✅ Integrated TaskService for all CRUD operations
- ✅ Changed Task ID from `number` to `string` (UUID)
- ✅ Updated priority values to match backend (LOW, MEDIUM, HIGH, URGENT)
- ✅ Updated status values to match backend (TODO, IN_PROGRESS, COMPLETED)
- ✅ Removed `type` field (Work/Personal) - kept for UI compatibility
- ✅ Added permission checks (`canEditTasks()`, `canDeleteTasks()`)
- ✅ Drag-and-drop now updates backend via API

---

## Data Flow

### Creating a Task
```
User clicks "Add Task"
    ↓
Opens modal with form
    ↓
User fills in details and clicks "Create"
    ↓
dashboard.component.ts: createTask()
    ↓
task.service.ts: POST /tasks with JWT token
    ↓
Backend: JwtAuthGuard validates token
    ↓
Backend: PermissionsGuard checks TASK_CREATE permission
    ↓
Backend: Creates task, assigns to user's organization
    ↓
Backend: AuditLogInterceptor logs TASK_CREATE action
    ↓
Backend: Returns created task
    ↓
Dashboard: Adds task to local array and refreshes UI
```

### Viewing Tasks (Role-Based)
```
User logs in
    ↓
dashboard.component.ts: ngOnInit() → loadTasks()
    ↓
task.service.ts: GET /tasks with JWT token
    ↓
Backend: JwtAuthGuard validates token
    ↓
Backend: TasksService.findAll(user)
    ↓
If OWNER/ADMIN:
  - Returns ALL tasks in organization
If VIEWER:
  - Returns only tasks where user is owner OR assigned
    ↓
Dashboard: Organizes tasks by status
    ↓
UI displays tasks in TODO, IN_PROGRESS, COMPLETED columns
```

---

## Security & Permissions

### Authentication
- All API calls require valid JWT token
- Token stored in `localStorage` (key: `access_token`)
- Token included in `Authorization: Bearer <token>` header
- Unauthenticated requests return 401 Unauthorized

### Authorization (Role-Based)
| Action | OWNER | ADMIN | VIEWER |
|--------|-------|-------|--------|
| View all org tasks | ✅ | ✅ | ❌ (own only) |
| Create tasks | ✅ | ✅ | ✅ |
| Update any task | ✅ | ✅ | ❌ (own only) |
| Delete any task | ✅ | ✅ | ❌ (own only) |

### Error Handling
All API operations include error handling:
```typescript
error: (error) => {
  console.error('Error message:', error);
  this.errorMessage = error.error?.message || 'Failed to perform action';
  this.isLoading = false;
}
```

Common errors:
- **401**: Not authenticated (invalid/expired token)
- **403**: Forbidden (insufficient permissions)
- **404**: Task not found
- **400**: Validation error (missing required fields)

---

## UI Features

### Loading States
- `isLoading` flag shows/hides loading spinner
- Prevents multiple submissions
- Active during API calls

### Error Display
- `errorMessage` property stores error text
- Displayed in modal or alert
- User-friendly messages for permission denials

### Real-Time Updates
- Tasks update immediately after API response
- Drag-and-drop triggers instant backend sync
- Optimistic UI updates for better UX

---

## Testing the Integration

### 1. Start Backend Server
```bash
cd company-workspace
npx nx serve backend
```
Server runs on `http://localhost:3000`

### 2. Start Frontend Dashboard
```bash
cd company-workspace
npx nx serve dashboard
```
Dashboard runs on `http://localhost:4200`

### 3. Test Scenarios

#### Test 1: Login and View Tasks
1. Login with one of the test users:
   - `chrisKaram@gmail.com` (OWNER) - Password: `Admin@1234`
   - `vindrajit1996@gmail.com` (ADMIN) - Password: `Admin@1234`
   - `testuser@gmail.com` (VIEWER) - Password: `Admin@1234`
2. Dashboard should load tasks from backend
3. OWNER/ADMIN see all org tasks, VIEWER sees only own tasks

#### Test 2: Create Task
1. Click "Add Task" button
2. Fill in title, description, priority
3. Click "Create Task"
4. Check network tab: POST /tasks request
5. Task appears in appropriate column

#### Test 3: Edit Task
1. Click on a task to edit
2. Modify fields
3. Click "Update Task"
4. Check network tab: PATCH /tasks/:id request
5. Task updates in UI

#### Test 4: Delete Task
1. Click on a task to edit
2. Click "Delete Task"
3. Confirm deletion
4. Check network tab: DELETE /tasks/:id request
5. Task removed from UI

#### Test 5: Permission Denial (VIEWER)
1. Login as `testuser@gmail.com` (VIEWER)
2. Create your own task
3. Try to edit a task created by someone else
4. Should see "403 Forbidden" error

#### Test 6: Drag and Drop
1. Drag a task from TODO to IN_PROGRESS
2. Check network tab: PATCH /tasks/:id with status update
3. Task status updated in backend

---

## Configuration

### API Base URL
**Location**: `task.service.ts` line 55

```typescript
private apiUrl = 'http://localhost:3000/api';
```

**For Production**: Change to your production API URL:
```typescript
private apiUrl = environment.apiUrl; // Use environment config
```

### Token Storage
Tokens are stored in `localStorage`:
- Key: `access_token`
- Set after successful login in `auth.service.ts`
- Retrieved in `task.service.ts` for API calls

---

## Next Steps

### 1. Add Audit Log Viewer
Create a new component to display audit logs:
```bash
nx generate component audit-logs
```

Backend endpoint needed:
```typescript
@Controller('audit-logs')
export class AuditLogsController {
  @Get()
  @RequirePermissions(Permission.ORG_MANAGE)
  getAuditLogs(@Query() filters, @CurrentUser() user: User) {
    return this.auditLogService.getAuditLogs(filters);
  }
}
```

### 2. Add Organization Management UI
- Create organization component
- Add/remove users from organization
- Change user roles
- View organization details

### 3. Enhance Task Features
- Assign tasks to other users
- Add comments to tasks
- File attachments
- Task dependencies

### 4. Improve Error Handling
- Toast notifications for success/error
- Retry mechanism for failed requests
- Offline detection and queueing

### 5. Add Real-Time Updates
- WebSocket integration for live task updates
- Notify when other users modify tasks
- Collaborative editing indicators

---

## Summary

✅ **Implemented API Endpoints**:
- POST /tasks (Create)
- GET /tasks (List with role-based filtering)
- PUT/PATCH /tasks/:id (Update)
- DELETE /tasks/:id (Delete)

✅ **Created Services**:
- TaskService with full CRUD operations
- Type-safe interfaces matching backend DTOs

✅ **Updated Components**:
- Dashboard component integrated with API
- Loading states and error handling
- Permission-aware UI

⚠️ **Pending**:
- GET /audit-logs endpoint (backend)
- Audit log viewer UI (frontend)

The dashboard is now fully connected to the RBAC backend with secure, role-based task management!
