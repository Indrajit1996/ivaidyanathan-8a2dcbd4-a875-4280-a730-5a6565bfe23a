import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User, UserRole } from '../user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { RbacService } from '../services/rbac.service';
import { Permission } from '../enums/permission.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private rbacService: RbacService
  ) {}

  /**
   * Create a new task
   */
  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    if (!user.organizationId) {
      throw new ForbiddenException(
        'You must belong to an organization to create tasks'
      );
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      ownerId: user.id,
      organizationId: user.organizationId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Return task with populated relations
    return this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['owner', 'assignedTo', 'organization'],
    });
  }

  /**
   * Get all tasks visible to the user based on their role
   * All users (OWNER, ADMIN, VIEWER) can see all tasks in their organization
   * VIEWER users can only READ tasks, not modify them (enforced by permissions)
   */
  async findAll(user: User): Promise<Task[]> {
    if (!user.organizationId) {
      return [];
    }

    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });

    // All users can see all tasks in the organization
    // Permission-based access control (create/update/delete) is enforced at the controller level
    return query.getMany();
  }

  /**
   * Get a specific task by ID
   */
  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner', 'assignedTo', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify access
    this.verifyAccess(task, user, Permission.TASK_READ_OWN);

    return task;
  }

  /**
   * Update a task
   */
  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User
  ): Promise<Task> {
    const task = await this.findOne(id, user);

    // Verify update access
    this.verifyAccess(task, user, Permission.TASK_UPDATE_OWN);

    // If assignedToId is being updated, clear the old assignedTo relation
    // to avoid stale data
    if (updateTaskDto.assignedToId !== undefined) {
      task.assignedTo = null;
    }

    Object.assign(task, updateTaskDto);
    await this.taskRepository.save(task);

    // Always return a fresh task with populated relations to ensure
    // the assignedTo object matches the assignedToId
    return this.taskRepository.findOne({
      where: { id: task.id },
      relations: ['owner', 'assignedTo', 'organization'],
    });
  }

  /**
   * Delete a task
   */
  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    // Verify delete access
    this.verifyAccess(task, user, Permission.TASK_DELETE_OWN);

    await this.taskRepository.remove(task);
  }

  /**
   * Get tasks by status
   */
  async findByStatus(status: string, user: User): Promise<Task[]> {
    if (!user.organizationId) {
      return [];
    }

    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.organizationId = :organizationId', {
        organizationId: user.organizationId,
      })
      .andWhere('task.status = :status', { status });

    // All users can see all tasks in the organization
    return query.getMany();
  }

  /**
   * Verify user has access to perform action on task
   */
  private verifyAccess(
    task: Task,
    user: User,
    requiredPermission: Permission
  ): void {
    // Check organization membership
    if (task.organizationId !== user.organizationId) {
      throw new ForbiddenException(
        'You do not have access to this task'
      );
    }

    // OWNER and ADMIN have access to all tasks
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      return;
    }

    // VIEWER must own the task or be assigned to it
    if (task.ownerId !== user.id && task.assignedToId !== user.id) {
      throw new ForbiddenException(
        'You do not have access to this task'
      );
    }

    // Verify permission
    if (!this.rbacService.hasPermission(user.role, requiredPermission)) {
      throw new ForbiddenException(
        `You do not have permission: ${requiredPermission}`
      );
    }
  }
}
