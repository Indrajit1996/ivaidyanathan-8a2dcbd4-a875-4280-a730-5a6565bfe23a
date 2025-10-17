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
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permission } from '../enums/permission.enum';
import { User, UserRole } from '../user.entity';
import { AuditLogInterceptor } from '../interceptors/audit-log.interceptor';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService
  ) {}

  @Post()
  @RequirePermissions(Permission.ORG_READ)
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: User
  ) {
    return this.organizationsService.create(createOrganizationDto, user);
  }

  @Get()
  @RequirePermissions(Permission.ORG_READ)
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.ORG_READ)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.organizationsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ORG_MANAGE)
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @CurrentUser() user: User
  ) {
    return this.organizationsService.update(id, updateOrganizationDto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ORG_MANAGE)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.organizationsService.remove(id, user);
  }

  @Get(':id/users')
  @RequirePermissions(Permission.USER_READ)
  getUsers(@Param('id') id: string, @CurrentUser() user: User) {
    return this.organizationsService.getUsers(id, user);
  }

  @Post(':id/users/:userId')
  @RequirePermissions(Permission.USER_CREATE)
  addUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
    @CurrentUser() user: User
  ) {
    return this.organizationsService.addUser(id, userId, role, user);
  }

  @Delete(':id/users/:userId')
  @RequirePermissions(Permission.USER_DELETE)
  removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User
  ) {
    return this.organizationsService.removeUser(id, userId, user);
  }

  @Patch(':id/users/:userId/role')
  @RequirePermissions(Permission.USER_UPDATE)
  updateUserRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
    @CurrentUser() user: User
  ) {
    return this.organizationsService.updateUserRole(id, userId, role, user);
  }
}
