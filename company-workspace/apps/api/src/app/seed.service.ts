import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { Organization } from './entities/organization.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async onModuleInit() {
    await this.seedOrganization();
    await this.seedUsers();
  }

  private async seedOrganization() {
    const orgName = 'Default Organization';

    const existingOrg = await this.organizationRepository.findOne({
      where: { name: orgName },
    });

    if (existingOrg) {
      console.log(`Organization already exists: ${orgName}`);
      return existingOrg;
    }

    const organization = this.organizationRepository.create({
      name: orgName,
      description: 'Default organization for all users',
    });

    await this.organizationRepository.save(organization);
    console.log(`Organization created: ${orgName}`);
    return organization;
  }

  private async seedUsers() {
    // Get the default organization
    const organization = await this.organizationRepository.findOne({
      where: { name: 'Default Organization' },
    });

    if (!organization) {
      console.error('Default organization not found. Users will not be created.');
      return;
    }

    const usersToSeed = [
      {
        email: 'vindrajit1996@gmail.com',
        password: 'Admin@1234',
        role: UserRole.ADMIN,
      },
      {
        email: 'chrisKaram@gmail.com',
        password: 'Admin@1234',
        role: UserRole.OWNER,
      },
      {
        email: 'testuser@gmail.com',
        password: 'Admin@1234',
        role: UserRole.VIEWER,
      },
    ];

    for (const userData of usersToSeed) {
      let existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        // Update existing user with organization if not set
        if (!existingUser.organizationId) {
          existingUser.organizationId = organization.id;
          await this.userRepository.save(existingUser);
          console.log(`User updated with organization: ${userData.email}`);
        } else {
          console.log(`User already exists: ${userData.email}`);
        }
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = this.userRepository.create({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        organizationId: organization.id,
      });

      await this.userRepository.save(user);
      console.log(`User created: ${userData.email} with role ${userData.role}`);
    }
  }
}
