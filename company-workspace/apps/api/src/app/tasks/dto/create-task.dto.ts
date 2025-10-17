import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TaskStatus, TaskPriority } from '../../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  type?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}
