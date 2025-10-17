import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { UserRole } from '../../user.entity';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract resource ID from request params
    const resourceId = request.params.id || request.params.taskId;

    if (!resourceId) {
      // If no resource ID, allow (creation endpoints)
      return true;
    }

    // OWNER and ADMIN can access all resources in their organization
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      // Still verify the resource belongs to the same organization
      const task = await this.taskRepository.findOne({
        where: { id: resourceId },
        relations: ['organization'],
      });

      if (!task) {
        throw new NotFoundException('Resource not found');
      }

      // Check if task belongs to user's organization
      if (task.organizationId !== user.organizationId) {
        throw new ForbiddenException(
          'You do not have access to this resource'
        );
      }

      return true;
    }

    // For VIEWER, verify ownership
    const task = await this.taskRepository.findOne({
      where: { id: resourceId },
    });

    if (!task) {
      throw new NotFoundException('Resource not found');
    }

    // Check if user owns the task or is assigned to it
    if (task.ownerId !== user.id && task.assignedToId !== user.id) {
      throw new ForbiddenException('You do not own this resource');
    }

    // Verify same organization
    if (task.organizationId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
