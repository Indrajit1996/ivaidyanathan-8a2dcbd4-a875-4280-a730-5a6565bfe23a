import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permission } from '../enums/permission.enum';
import { User } from '../user.entity';
import { AuditLogInterceptor } from '../interceptors/audit-log.interceptor';

@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @RequirePermissions(Permission.TASK_READ_OWN)
  findAll(@CurrentUser() user: User) {
    return this.tasksService.findAll(user);
  }

  @Get('status/:status')
  @RequirePermissions(Permission.TASK_READ_OWN)
  findByStatus(@Param('status') status: string, @CurrentUser() user: User) {
    return this.tasksService.findByStatus(status, user);
  }

  @Get(':id')
  @RequirePermissions(Permission.TASK_READ_OWN)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions(Permission.TASK_UPDATE_OWN)
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE_OWN)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.remove(id, user);
  }
}
