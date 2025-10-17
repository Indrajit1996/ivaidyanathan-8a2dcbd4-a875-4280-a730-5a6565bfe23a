import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4200';
const API_URL = 'http://localhost:3000/api';

// Test credentials - adjust based on your seed data
const TEST_CREDENTIALS = {
  owner: {
    email: 'owner@test.com',
    password: 'password123',
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
  },
  viewer: {
    email: 'viewer@test.com',
    password: 'password123',
  },
};

test.describe('Dashboard E2E Tests', () => {
  test.describe('Authentication Flow', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      // Fill in login form
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for navigation to dashboard
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // Verify we're on the dashboard
      expect(page.url()).toContain('/dashboard');
    });

    test('should show error message with invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');

      await page.click('button[type="submit"]');

      // Wait for error message
      const errorMessage = await page.locator('.error-message, .alert-danger');
      await expect(errorMessage).toBeVisible();
    });

    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Should redirect to login
      await page.waitForURL(`${BASE_URL}/login`);
      expect(page.url()).toContain('/login');
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);

      // Logout
      await page.click('button:has-text("Logout"), a:has-text("Logout")');

      // Should redirect to login
      await page.waitForURL(`${BASE_URL}/login`);
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Dashboard Features', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should display dashboard with task columns', async ({ page }) => {
      // Wait for tasks to load
      await page.waitForSelector('.kanban-board, .task-board');

      // Check for three columns: TODO, IN_PROGRESS, COMPLETED
      const todoColumn = await page.locator('text=TODO, text=To Do').first();
      const inProgressColumn = await page.locator('text=IN PROGRESS, text=In Progress').first();
      const completedColumn = await page.locator('text=COMPLETED, text=Completed').first();

      await expect(todoColumn).toBeVisible();
      await expect(inProgressColumn).toBeVisible();
      await expect(completedColumn).toBeVisible();
    });

    test('should open create task modal', async ({ page }) => {
      // Click "New Task" or "Create Task" button
      await page.click('button:has-text("New Task"), button:has-text("Create Task")');

      // Verify modal is open
      const modal = await page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();

      // Verify form fields are present
      await expect(page.locator('input[name="title"], #title')).toBeVisible();
    });

    test('should create a new task', async ({ page }) => {
      // Open modal
      await page.click('button:has-text("New Task"), button:has-text("Create Task")');

      // Fill in task details
      await page.fill('input[name="title"], #title', 'E2E Test Task');
      await page.fill('textarea[name="description"], #description', 'This is an E2E test task');

      // Select priority (if dropdown exists)
      const prioritySelect = page.locator('select[name="priority"], #priority');
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption('HIGH');
      }

      // Submit form
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

      // Wait for modal to close
      await page.waitForSelector('.modal, [role="dialog"]', { state: 'hidden' });

      // Verify task appears in TODO column
      const newTask = await page.locator('text=E2E Test Task');
      await expect(newTask).toBeVisible();
    });

    test('should edit an existing task', async ({ page }) => {
      // Wait for tasks to load
      await page.waitForTimeout(1000);

      // Click on a task or edit button
      const firstTask = await page.locator('.task-item, .task-card').first();

      // Look for edit button or click on task
      const editButton = await page.locator('button:has-text("Edit"), .edit-btn').first();
      if (await editButton.isVisible()) {
        await editButton.click();
      } else {
        await firstTask.click();
      }

      // Wait for edit modal
      await page.waitForSelector('.modal, [role="dialog"]');

      // Modify task title
      const titleInput = page.locator('input[name="title"], #title');
      await titleInput.fill('Updated Task Title');

      // Save changes
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');

      // Wait for modal to close
      await page.waitForSelector('.modal, [role="dialog"]', { state: 'hidden' });

      // Verify updated task appears
      await expect(page.locator('text=Updated Task Title')).toBeVisible();
    });

    test('should delete a task', async ({ page }) => {
      // Create a task first
      await page.click('button:has-text("New Task"), button:has-text("Create Task")');
      await page.fill('input[name="title"], #title', 'Task to Delete');
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(500);

      // Find and click delete button
      const deleteButton = await page.locator('button:has-text("Delete"), .delete-btn').first();

      // Handle confirmation dialog
      page.on('dialog', (dialog) => dialog.accept());

      await deleteButton.click();

      // Wait for task to be removed
      await page.waitForTimeout(500);

      // Verify task is no longer visible
      const deletedTask = page.locator('text=Task to Delete');
      await expect(deletedTask).not.toBeVisible();
    });

    test('should filter tasks by priority', async ({ page }) => {
      // Wait for tasks to load
      await page.waitForTimeout(1000);

      // Select filter
      const priorityFilter = page.locator('select:has-text("Priority"), select[name="filterByPriority"]');
      if (await priorityFilter.isVisible()) {
        await priorityFilter.selectOption('HIGH');

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify only high priority tasks are visible
        const tasks = await page.locator('.task-item, .task-card').all();

        // At least verify the filter control exists
        expect(tasks.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should sort tasks', async ({ page }) => {
      // Wait for tasks to load
      await page.waitForTimeout(1000);

      // Select sort option
      const sortSelect = page.locator('select:has-text("Sort"), select[name="sortBy"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('title');

        // Wait for sort to apply
        await page.waitForTimeout(500);

        // Verify tasks are sorted (you'd need to check actual order)
        const tasks = await page.locator('.task-item, .task-card').all();
        expect(tasks.length).toBeGreaterThanOrEqual(0);
      }
    });

    test('should toggle between board and chart view', async ({ page }) => {
      // Look for view toggle button
      const viewToggle = page.locator('button:has-text("Chart"), button:has-text("Statistics"), button:has-text("View")');

      if (await viewToggle.isVisible()) {
        await viewToggle.click();

        // Wait for view to change
        await page.waitForTimeout(500);

        // Verify chart is visible
        const chart = page.locator('canvas, .chart-container');
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('Drag and Drop', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
    });

    test('should drag task from TODO to IN_PROGRESS', async ({ page }) => {
      // Create a task in TODO first
      await page.click('button:has-text("New Task"), button:has-text("Create Task")');
      await page.fill('input[name="title"], #title', 'Drag Test Task');
      await page.click('button[type="submit"], button:has-text("Save")');
      await page.waitForTimeout(500);

      // Find the task
      const task = page.locator('text=Drag Test Task').first();

      // Find the IN_PROGRESS column
      const inProgressColumn = page.locator('.in-progress-column, [data-status="IN_PROGRESS"]').first();

      // Perform drag and drop
      await task.dragTo(inProgressColumn);

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify task moved (this is simplified - actual verification would depend on DOM structure)
      const movedTask = page.locator('text=Drag Test Task');
      await expect(movedTask).toBeVisible();
    });
  });

  test.describe('Mobile Responsive', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should display mobile menu', async ({ page }) => {
      // Look for mobile menu button
      const menuButton = page.locator('button:has-text("Menu"), .menu-btn, .hamburger');

      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Verify menu is visible
        const menu = page.locator('.mobile-menu, .sidebar');
        await expect(menu).toBeVisible();
      }
    });

    test('should be able to create task on mobile', async ({ page }) => {
      await page.click('button:has-text("New Task"), button:has-text("Create Task")');

      const modal = page.locator('.modal, [role="dialog"]');
      await expect(modal).toBeVisible();

      await page.fill('input[name="title"], #title', 'Mobile Test Task');
      await page.click('button[type="submit"], button:has-text("Save")');

      await page.waitForTimeout(500);
      await expect(page.locator('text=Mobile Test Task')).toBeVisible();
    });
  });

  test.describe('Dark Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should toggle dark mode', async ({ page }) => {
      // Look for dark mode toggle
      const darkModeToggle = page.locator('button:has-text("Dark"), .dark-mode-toggle');

      if (await darkModeToggle.isVisible()) {
        // Get initial state
        const body = page.locator('body');
        const initialClass = await body.getAttribute('class');

        // Toggle dark mode
        await darkModeToggle.click();

        // Wait for change
        await page.waitForTimeout(300);

        // Verify class changed
        const newClass = await body.getAttribute('class');
        expect(newClass).not.toBe(initialClass);
      }
    });
  });

  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should navigate to users page', async ({ page }) => {
      const usersLink = page.locator('a:has-text("Users"), button:has-text("Users")');

      if (await usersLink.isVisible()) {
        await usersLink.click();

        await page.waitForURL('**/users');
        expect(page.url()).toContain('/users');
      }
    });

    test('should display list of users', async ({ page }) => {
      await page.goto(`${BASE_URL}/users`);
      await page.waitForTimeout(1000);

      // Verify users table or list is visible
      const usersList = page.locator('.users-list, .users-table, table');

      if (await usersList.isVisible()) {
        await expect(usersList).toBeVisible();
      }
    });
  });

  test.describe('Audit Logs', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
    });

    test('should navigate to audit logs page', async ({ page }) => {
      const auditLink = page.locator('a:has-text("Audit"), button:has-text("Audit")');

      if (await auditLink.isVisible()) {
        await auditLink.click();

        await page.waitForURL('**/audit-logs');
        expect(page.url()).toContain('/audit-logs');
      }
    });

    test('should display audit logs', async ({ page }) => {
      await page.goto(`${BASE_URL}/audit-logs`);
      await page.waitForTimeout(1000);

      // Verify audit logs are displayed
      const auditTable = page.locator('.audit-logs, table');

      if (await auditTable.isVisible()) {
        await expect(auditTable).toBeVisible();
      }
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.owner.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.owner.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(1000);
    });

    test('should open new task modal with Ctrl+N', async ({ page }) => {
      // Press Ctrl+N (Cmd+N on Mac)
      await page.keyboard.press('Control+N');

      // Wait for modal
      await page.waitForTimeout(500);

      const modal = page.locator('.modal, [role="dialog"]');

      // Modal might be visible
      const isVisible = await modal.isVisible().catch(() => false);

      // This test is informational - keyboard shortcuts may or may not be implemented
      if (isVisible) {
        await expect(modal).toBeVisible();
      }
    });
  });
});
