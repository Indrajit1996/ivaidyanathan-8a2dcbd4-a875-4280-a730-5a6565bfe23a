import axios from 'axios';

describe('Tasks API Integration Tests', () => {
  const API_URL = 'http://localhost:3000/api';
  let authToken: string;
  let userId: string;
  let taskId: string;

  // Test user credentials (you may need to adjust based on your seed data)
  const testUser = {
    email: 'owner@test.com',
    password: 'password123',
  };

  beforeAll(async () => {
    // Login to get auth token
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, testUser);
      authToken = loginResponse.data.access_token;
      userId = loginResponse.data.user.id;
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
  });

  describe('POST /tasks - Create Task', () => {
    it('should create a new task with valid data', async () => {
      const newTask = {
        title: 'Integration Test Task',
        description: 'This is a test task',
        priority: 'HIGH',
        status: 'TODO',
        type: 'Work',
      };

      const response = await axios.post(`${API_URL}/tasks`, newTask, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title).toBe(newTask.title);
      expect(response.data.description).toBe(newTask.description);
      expect(response.data.priority).toBe(newTask.priority);
      expect(response.data.status).toBe(newTask.status);
      expect(response.data.ownerId).toBe(userId);
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('updatedAt');

      // Save taskId for later tests
      taskId = response.data.id;
    });

    it('should return 401 without authentication', async () => {
      const newTask = {
        title: 'Unauthorized Task',
        description: 'Should fail',
      };

      try {
        await axios.post(`${API_URL}/tasks`, newTask);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should return 400 with invalid data', async () => {
      const invalidTask = {
        // Missing required 'title' field
        description: 'Invalid task without title',
      };

      try {
        await axios.post(`${API_URL}/tasks`, invalidTask, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /tasks - List All Tasks', () => {
    it('should return list of tasks for authenticated user', async () => {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);

      // Verify task structure
      const task = response.data[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('ownerId');
      expect(task).toHaveProperty('organizationId');
    });

    it('should return 401 without authentication', async () => {
      try {
        await axios.get(`${API_URL}/tasks`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('GET /tasks/:id - Get Single Task', () => {
    it('should return a specific task by ID', async () => {
      const response = await axios.get(`${API_URL}/tasks/${taskId}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(taskId);
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('description');
      expect(response.data).toHaveProperty('owner');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.get(`${API_URL}/tasks/${fakeId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('GET /tasks/status/:status - Filter by Status', () => {
    it('should return tasks filtered by TODO status', async () => {
      const response = await axios.get(`${API_URL}/tasks/status/TODO`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      // All returned tasks should have TODO status
      response.data.forEach((task: any) => {
        expect(task.status).toBe('TODO');
      });
    });

    it('should return tasks filtered by IN_PROGRESS status', async () => {
      const response = await axios.get(`${API_URL}/tasks/status/IN_PROGRESS`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return tasks filtered by COMPLETED status', async () => {
      const response = await axios.get(`${API_URL}/tasks/status/COMPLETED`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('PATCH /tasks/:id - Update Task', () => {
    it('should update task title', async () => {
      const updateData = {
        title: 'Updated Task Title',
      };

      const response = await axios.patch(
        `${API_URL}/tasks/${taskId}`,
        updateData,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.id).toBe(taskId);
    });

    it('should update task status', async () => {
      const updateData = {
        status: 'IN_PROGRESS',
      };

      const response = await axios.patch(
        `${API_URL}/tasks/${taskId}`,
        updateData,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('IN_PROGRESS');
    });

    it('should update task priority', async () => {
      const updateData = {
        priority: 'URGENT',
      };

      const response = await axios.patch(
        `${API_URL}/tasks/${taskId}`,
        updateData,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.priority).toBe('URGENT');
    });

    it('should update multiple fields at once', async () => {
      const updateData = {
        title: 'Multi-field Update',
        description: 'Updated description',
        status: 'COMPLETED',
        priority: 'LOW',
      };

      const response = await axios.patch(
        `${API_URL}/tasks/${taskId}`,
        updateData,
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.description).toBe(updateData.description);
      expect(response.data.status).toBe(updateData.status);
      expect(response.data.priority).toBe(updateData.priority);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.patch(
          `${API_URL}/tasks/${fakeId}`,
          { title: 'Update' },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('DELETE /tasks/:id - Delete Task', () => {
    it('should delete a task successfully', async () => {
      const response = await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Verify task is deleted by trying to fetch it
      try {
        await axios.get(`${API_URL}/tasks/${taskId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should return 404 when deleting non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      try {
        await axios.delete(`${API_URL}/tasks/${fakeId}`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should return 401 without authentication', async () => {
      try {
        await axios.delete(`${API_URL}/tasks/${taskId}`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Task Workflow Integration', () => {
    it('should complete full task lifecycle', async () => {
      // 1. Create task
      const createResponse = await axios.post(
        `${API_URL}/tasks`,
        {
          title: 'Lifecycle Test Task',
          description: 'Test full workflow',
          priority: 'MEDIUM',
          status: 'TODO',
        },
        { headers: getAuthHeaders() }
      );

      expect(createResponse.status).toBe(201);
      const newTaskId = createResponse.data.id;

      // 2. Update to IN_PROGRESS
      const updateResponse1 = await axios.patch(
        `${API_URL}/tasks/${newTaskId}`,
        { status: 'IN_PROGRESS' },
        { headers: getAuthHeaders() }
      );

      expect(updateResponse1.data.status).toBe('IN_PROGRESS');

      // 3. Update to COMPLETED
      const updateResponse2 = await axios.patch(
        `${API_URL}/tasks/${newTaskId}`,
        { status: 'COMPLETED' },
        { headers: getAuthHeaders() }
      );

      expect(updateResponse2.data.status).toBe('COMPLETED');

      // 4. Delete task
      const deleteResponse = await axios.delete(
        `${API_URL}/tasks/${newTaskId}`,
        { headers: getAuthHeaders() }
      );

      expect(deleteResponse.status).toBe(200);
    });
  });

  describe('Permission and Access Control', () => {
    it('should allow task creation with TASK_CREATE permission', async () => {
      const response = await axios.post(
        `${API_URL}/tasks`,
        {
          title: 'Permission Test Task',
          description: 'Testing permissions',
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(201);

      // Clean up
      await axios.delete(`${API_URL}/tasks/${response.data.id}`, {
        headers: getAuthHeaders(),
      });
    });
  });
});
