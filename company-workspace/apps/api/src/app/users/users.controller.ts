import { Controller, Get, Delete, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users - Get all users in the organization
   * Accessible by: OWNER, ADMIN (read permission)
   */
  @Get()
  async getAllUsers(@Request() req) {
    const currentUser = req.user;

    if (!currentUser.organizationId) {
      throw new HttpException('User is not part of an organization', HttpStatus.BAD_REQUEST);
    }

    return this.usersService.findAllByOrganization(currentUser.organizationId);
  }

  /**
   * DELETE /api/users/:id - Delete a user
   * Accessible by: OWNER only
   * Cannot delete yourself
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  async deleteUser(@Param('id') userId: string, @Request() req) {
    const currentUser = req.user;

    // Prevent self-deletion
    if (currentUser.id === userId) {
      throw new HttpException('You cannot delete yourself', HttpStatus.FORBIDDEN);
    }

    // Ensure the user being deleted is in the same organization
    const userToDelete = await this.usersService.findById(userId);

    if (!userToDelete) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (userToDelete.organizationId !== currentUser.organizationId) {
      throw new HttpException('You can only delete users from your organization', HttpStatus.FORBIDDEN);
    }

    await this.usersService.deleteUser(userId);

    return {
      message: 'User deleted successfully',
      deletedUserId: userId
    };
  }
}
