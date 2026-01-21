import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';

export type RequestUser = {
  id: number;
  role: 'Owner' | 'Admin' | 'Viewer' | string;
  organizationId: number;
  email?: string;
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
  ) {}

  private async getOrgScopeOrgIds(user: RequestUser): Promise<number[]> {
    // Viewer: only their org
    if (user.role === 'Viewer') return [user.organizationId];

    // Owner/Admin: their org + its direct children (2-level hierarchy)
    const children = await this.orgRepo.find({
      where: { parentOrgId: user.organizationId },
    });

    return [user.organizationId, ...children.map((c) => c.id)];
  }

  async list(user: RequestUser, query?: { category?: string; status?: string }) {
    const orgIds = await this.getOrgScopeOrgIds(user);

    const qb = this.taskRepo.createQueryBuilder('task')
      .where('task.organizationId IN (:...orgIds)', { orgIds })
      .orderBy('task.order', 'ASC')
      .addOrderBy('task.updatedAt', 'DESC');

    if (query?.category) qb.andWhere('task.category = :category', { category: query.category });
    if (query?.status) qb.andWhere('task.status = :status', { status: query.status });

    return qb.getMany();
  }

  async create(user: RequestUser, dto: CreateTaskDto) {
    // create tasks in your org by default
    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      status: dto.status,
      order: 0,
      ownerId: user.id,
      organizationId: user.organizationId,
    });

    return this.taskRepo.save(task);
  }

  async update(user: RequestUser, id: number, dto: UpdateTaskDto) {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const orgIds = await this.getOrgScopeOrgIds(user);
    if (!orgIds.includes(task.organizationId)) {
      throw new ForbiddenException('Not allowed to access this task');
    }

    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async remove(user: RequestUser, id: number) {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const orgIds = await this.getOrgScopeOrgIds(user);
    if (!orgIds.includes(task.organizationId)) {
      throw new ForbiddenException('Not allowed to access this task');
    }

    await this.taskRepo.delete({ id });
    return { deleted: true };
  }
}
