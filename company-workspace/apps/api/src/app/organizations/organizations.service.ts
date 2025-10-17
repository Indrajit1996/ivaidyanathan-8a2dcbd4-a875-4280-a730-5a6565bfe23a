import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User, UserRole } from '../user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Create a new organization
   * Only system admins or users without an organization can create one
   */
  async create(
    createOrganizationDto: CreateOrganizationDto,
    user: User
  ): Promise<Organization> {
    // Check if organization name already exists
    const existingOrg = await this.organizationRepository.findOne({
      where: { name: createOrganizationDto.name },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    const organization = this.organizationRepository.create(
      createOrganizationDto
    );
    const savedOrg = await this.organizationRepository.save(organization);

    // Add the creating user to the organization as OWNER
    await this.userRepository.update(user.id, {
      organizationId: savedOrg.id,
      role: UserRole.OWNER,
    });

    return savedOrg;
  }

  /**
   * Get all organizations (system-wide view for super admins)
   */
  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find({
      relations: ['users', 'tasks'],
    });
  }

  /**
   * Get organization by ID
   */
  async findOne(id: string, user: User): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['users', 'tasks'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Users can only view their own organization unless they're system admin
    if (user.organizationId !== id && user.role !== UserRole.OWNER) {
      throw new ForbiddenException(
        'You do not have access to this organization'
      );
    }

    return organization;
  }

  /**
   * Update organization
   * Only OWNER can update organization
   */
  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    user: User
  ): Promise<Organization> {
    const organization = await this.findOne(id, user);

    // Only OWNER can update organization
    if (user.role !== UserRole.OWNER || user.organizationId !== id) {
      throw new ForbiddenException(
        'Only organization owners can update organization details'
      );
    }

    Object.assign(organization, updateOrganizationDto);
    return this.organizationRepository.save(organization);
  }

  /**
   * Delete organization
   * Only OWNER can delete organization
   */
  async remove(id: string, user: User): Promise<void> {
    const organization = await this.findOne(id, user);

    // Only OWNER can delete organization
    if (user.role !== UserRole.OWNER || user.organizationId !== id) {
      throw new ForbiddenException(
        'Only organization owners can delete the organization'
      );
    }

    await this.organizationRepository.remove(organization);
  }

  /**
   * Get users in an organization
   */
  async getUsers(organizationId: string, user: User): Promise<User[]> {
    // Verify user has access to this organization
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'You do not have access to this organization'
      );
    }

    return this.userRepository.find({
      where: { organizationId },
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  }

  /**
   * Add user to organization
   * Only OWNER and ADMIN can add users
   */
  async addUser(
    organizationId: string,
    userId: string,
    role: UserRole,
    currentUser: User
  ): Promise<User> {
    // Verify current user can manage organization
    if (currentUser.organizationId !== organizationId) {
      throw new ForbiddenException(
        'You do not have access to this organization'
      );
    }

    if (currentUser.role !== UserRole.OWNER && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only owners and admins can add users');
    }

    const userToAdd = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    if (userToAdd.organizationId) {
      throw new ConflictException('User already belongs to an organization');
    }

    // Update user's organization and role
    await this.userRepository.update(userId, {
      organizationId,
      role,
    });

    return this.userRepository.findOne({ where: { id: userId } });
  }

  /**
   * Remove user from organization
   * Only OWNER can remove users
   */
  async removeUser(
    organizationId: string,
    userId: string,
    currentUser: User
  ): Promise<void> {
    // Verify current user is OWNER of the organization
    if (
      currentUser.organizationId !== organizationId ||
      currentUser.role !== UserRole.OWNER
    ) {
      throw new ForbiddenException('Only owners can remove users');
    }

    // Cannot remove yourself
    if (userId === currentUser.id) {
      throw new ForbiddenException('You cannot remove yourself from the organization');
    }

    const userToRemove = await this.userRepository.findOne({
      where: { id: userId, organizationId },
    });

    if (!userToRemove) {
      throw new NotFoundException('User not found in this organization');
    }

    // Remove user from organization
    await this.userRepository.update(userId, {
      organizationId: null,
      role: UserRole.VIEWER,
    });
  }

  /**
   * Update user role in organization
   * Only OWNER can update roles
   */
  async updateUserRole(
    organizationId: string,
    userId: string,
    newRole: UserRole,
    currentUser: User
  ): Promise<User> {
    // Verify current user is OWNER of the organization
    if (
      currentUser.organizationId !== organizationId ||
      currentUser.role !== UserRole.OWNER
    ) {
      throw new ForbiddenException('Only owners can update user roles');
    }

    // Cannot change your own role
    if (userId === currentUser.id) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const userToUpdate = await this.userRepository.findOne({
      where: { id: userId, organizationId },
    });

    if (!userToUpdate) {
      throw new NotFoundException('User not found in this organization');
    }

    await this.userRepository.update(userId, { role: newRole });
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
