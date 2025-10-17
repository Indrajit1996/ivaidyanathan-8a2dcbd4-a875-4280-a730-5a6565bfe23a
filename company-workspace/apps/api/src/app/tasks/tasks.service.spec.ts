import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { User, UserRole } from '../user.entity';
import { RbacService } from '../services/rbac.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Permission } from '../enums/permission.enum';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let rbacService: jest.Mocked<RbacService>;

  // Mock data
  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockTaskId = 'task-123';

  const mockOwnerUser: User = {
    id: mockUserId,
    email: 'owner@test.com',
    password: 'hashedPassword',
    role: UserRole.OWNER,
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockViewerUser: User = {
    id: 'viewer-123',
    email: 'viewer@test.com',
    password: 'hashedPassword',
    role: UserRole.VIEWER,
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockTask: Task = {
    id: mockTaskId,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    type: 'Work',
    ownerId: mockUserId,
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Task;

  beforeEach(async () => {
    // Create mock repository
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    // Create mock RBAC service
    const mockRbac = {
      hasPermission: jest.fn(),
      hasAllPermissions: jest.fn(),
      hasAnyPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepo,
        },
        {
          provide: RbacService,
          useValue: mockRbac,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    rbacService = module.get(RbacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
      };

      const createdTask = { ...mockTask, id: 'new-task-id' };

      taskRepository.create.mockReturnValue(createdTask as any);
      taskRepository.save.mockResolvedValue(createdTask);
      taskRepository.findOne.mockResolvedValue({
        ...createdTask,
        owner: mockOwnerUser,
      } as any);

      const result = await service.create(createTaskDto, mockOwnerUser);

      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        ownerId: mockOwnerUser.id,
        organizationId: mockOwnerUser.organizationId,
      });
      expect(taskRepository.save).toHaveBeenCalledWith(createdTask);
      expect(result).toHaveProperty('owner');
    });

    it('should throw ForbiddenException if user has no organization', async () => {
      const userWithoutOrg = { ...mockOwnerUser, organizationId: null };
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
      };

      await expect(service.create(createTaskDto, userWithoutOrg)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.create(createTaskDto, userWithoutOrg)).rejects.toThrow(
        'You must belong to an organization to create tasks'
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks for user in organization', async () => {
      const mockTasks = [mockTask, { ...mockTask, id: 'task-456' }];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTasks),
      };

      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(mockOwnerUser);

      expect(result).toEqual(mockTasks);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'task.organizationId = :organizationId',
        { organizationId: mockOrganizationId }
      );
    });

    it('should return empty array if user has no organization', async () => {
      const userWithoutOrg = { ...mockOwnerUser, organizationId: null };

      const result = await service.findAll(userWithoutOrg);

      expect(result).toEqual([]);
      expect(taskRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task if user has access', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(mockTaskId, mockOwnerUser);

      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        relations: ['owner', 'assignedTo', 'organization'],
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockTaskId, mockOwnerUser)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne(mockTaskId, mockOwnerUser)).rejects.toThrow(
        'Task not found'
      );
    });

    it('should throw ForbiddenException if user from different organization', async () => {
      const taskFromDifferentOrg = {
        ...mockTask,
        organizationId: 'different-org-id',
      };
      taskRepository.findOne.mockResolvedValue(taskFromDifferentOrg);

      await expect(
        service.findOne(mockTaskId, mockOwnerUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a task successfully for OWNER', async () => {
      const updateDto = { title: 'Updated Title', status: TaskStatus.IN_PROGRESS };
      const updatedTask = { ...mockTask, ...updateDto };

      taskRepository.findOne
        .mockResolvedValueOnce(mockTask) // First call in findOne
        .mockResolvedValueOnce(updatedTask); // Second call after save

      taskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update(mockTaskId, updateDto, mockOwnerUser);

      expect(taskRepository.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException if VIEWER tries to update others task', async () => {
      const taskOwnedByOther = {
        ...mockTask,
        ownerId: 'different-user-id',
        assignedToId: null,
      };

      taskRepository.findOne.mockResolvedValue(taskOwnedByOther);
      rbacService.hasPermission.mockReturnValue(true);

      await expect(
        service.update(mockTaskId, { title: 'New Title' }, mockViewerUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should clear assignedTo relation when assignedToId is updated', async () => {
      const updateDto = { assignedToId: 'new-assignee-id' };
      const taskWithAssignee = { ...mockTask, assignedTo: { id: 'old-id' } as any };

      taskRepository.findOne
        .mockResolvedValueOnce(taskWithAssignee) // First call in findOne
        .mockResolvedValueOnce({ ...taskWithAssignee, assignedToId: 'new-assignee-id' }); // After save

      taskRepository.save.mockResolvedValue({} as any);

      await service.update(mockTaskId, updateDto, mockOwnerUser);

      // Verify that assignedTo was set to null before saving
      expect(taskRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a task successfully for OWNER', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.remove.mockResolvedValue(mockTask);

      await service.remove(mockTaskId, mockOwnerUser);

      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw ForbiddenException if VIEWER tries to delete others task', async () => {
      const taskOwnedByOther = {
        ...mockTask,
        ownerId: 'different-user-id',
        assignedToId: null,
      };

      taskRepository.findOne.mockResolvedValue(taskOwnedByOther);
      rbacService.hasPermission.mockReturnValue(true);

      await expect(service.remove(mockTaskId, mockViewerUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findByStatus', () => {
    it('should return tasks filtered by status', async () => {
      const mockTasks = [{ ...mockTask, status: TaskStatus.IN_PROGRESS }];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockTasks),
      };

      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByStatus('IN_PROGRESS', mockOwnerUser);

      expect(result).toEqual(mockTasks);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: 'IN_PROGRESS' }
      );
    });

    it('should return empty array if user has no organization', async () => {
      const userWithoutOrg = { ...mockOwnerUser, organizationId: null };

      const result = await service.findByStatus('TODO', userWithoutOrg);

      expect(result).toEqual([]);
    });
  });

  describe('verifyAccess (private method testing via public methods)', () => {
    it('should allow OWNER to access any task in organization', async () => {
      const taskOwnedByOther = {
        ...mockTask,
        ownerId: 'different-user-id',
      };

      taskRepository.findOne.mockResolvedValue(taskOwnedByOther);

      // Should not throw error
      const result = await service.findOne(mockTaskId, mockOwnerUser);
      expect(result).toEqual(taskOwnedByOther);
    });

    it('should allow VIEWER to access own task', async () => {
      const viewerTask = {
        ...mockTask,
        ownerId: mockViewerUser.id,
      };

      taskRepository.findOne.mockResolvedValue(viewerTask);
      rbacService.hasPermission.mockReturnValue(true);

      const result = await service.findOne(mockTaskId, mockViewerUser);
      expect(result).toEqual(viewerTask);
    });

    it('should allow VIEWER to access assigned task', async () => {
      const assignedTask = {
        ...mockTask,
        ownerId: 'different-user-id',
        assignedToId: mockViewerUser.id,
      };

      taskRepository.findOne.mockResolvedValue(assignedTask);
      rbacService.hasPermission.mockReturnValue(true);

      const result = await service.findOne(mockTaskId, mockViewerUser);
      expect(result).toEqual(assignedTask);
    });
  });
});
