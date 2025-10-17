import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const adminEmail = 'vindrajit1996@gmail.com';

    const existingUser = await this.userRepository.findOne({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@1234', 10);

    const adminUser = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    await this.userRepository.save(adminUser);
    console.log(`Admin user created: ${adminEmail}`);
  }
}
