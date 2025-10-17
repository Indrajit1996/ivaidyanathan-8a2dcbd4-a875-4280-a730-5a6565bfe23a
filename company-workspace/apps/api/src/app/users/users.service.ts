import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Find all users in an organization
   */
  async findAllByOrganization(organizationId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { organizationId },
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Find a user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'role', 'organizationId', 'createdAt', 'updatedAt']
    });
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<void> {
    await this.usersRepository.delete(userId);
  }
}
