import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { Organization } from './entities/organization.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async onModuleInit() {
    const shouldSeed = process.env.AUTO_SEED !== 'false';

    if (!shouldSeed) {
      this.logger.log('🌱 Auto-seeding is disabled (AUTO_SEED=false)');
      return;
    }

    this.logger.log('🌱 Starting database seeding...');

    try {
      await this.seedDatabase();
      this.logger.log('✅ Database seeding completed successfully');
    } catch (error) {
      this.logger.error('❌ Database seeding failed:', error.message);
      throw error;
    }
  }

  async seedDatabase() {
    await this.seedOrganization();
    await this.seedUsers();
  }

  private async seedOrganization() {
    const orgName = 'Default Organization';

    const existingOrg = await this.organizationRepository.findOne({
      where: { name: orgName },
    });

    if (existingOrg) {
      this.logger.log(`   ✓ Organization already exists: ${orgName}`);
      return existingOrg;
    }

    const organization = this.organizationRepository.create({
      name: orgName,
      description: 'Default organization for all users',
    });

    await this.organizationRepository.save(organization);
    this.logger.log(`   ✓ Organization created: ${orgName}`);
    return organization;
  }

  private async seedUsers() {
    // Get the default organization
    const organization = await this.organizationRepository.findOne({
      where: { name: 'Default Organization' },
    });

    if (!organization) {
      this.logger.error('   ✗ Default organization not found. Users will not be created.');
      return;
    }

    const usersToSeed = [
      {
        email: 'vindrajit1996@gmail.com',
        password: 'Admin@1234',
        role: UserRole.ADMIN,
        name: 'Vindrajit Admin',
      },
      {
        email: 'chrisKaram@gmail.com',
        password: 'Admin@1234',
        role: UserRole.OWNER,
        name: 'Chris Karam',
      },
      {
        email: 'testuser@gmail.com',
        password: 'Admin@1234',
        role: UserRole.VIEWER,
        name: 'Test Viewer',
      },
    ];

    let created = 0;
    let updated = 0;
    let existing = 0;

    for (const userData of usersToSeed) {
      let existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        // Update existing user with organization if not set
        if (!existingUser.organizationId) {
          existingUser.organizationId = organization.id;
          await this.userRepository.save(existingUser);
          this.logger.log(`   ✓ User updated with organization: ${userData.email}`);
          updated++;
        } else {
          this.logger.log(`   ○ User already exists: ${userData.email}`);
          existing++;
        }
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = this.userRepository.create({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        name: userData.name,
        organizationId: organization.id,
      });

      await this.userRepository.save(user);
      this.logger.log(`   ✓ User created: ${userData.email} (${userData.role})`);
      created++;
    }

    this.logger.log(`   📊 Summary: ${created} created, ${updated} updated, ${existing} existing`);
  }
}
