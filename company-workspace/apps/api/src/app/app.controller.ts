import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  // Example: Protected route - requires authentication
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return {
      message: 'This is a protected route',
      user: req.user
    };
  }

  // Example: Admin-only route
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  getAdminData(@Request() req) {
    return {
      message: 'This route is only accessible to ADMIN and OWNER roles',
      user: req.user,
      data: 'Sensitive admin data'
    };
  }

  // Example: Owner-only route
  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  getOwnerData(@Request() req) {
    return {
      message: 'This route is only accessible to OWNER role',
      user: req.user,
      data: 'Super sensitive owner data'
    };
  }
}
