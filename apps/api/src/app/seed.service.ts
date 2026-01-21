import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const userCount = await this.userRepo.count();
    if (userCount > 0) return;

    const parent = await this.orgRepo.save({ name: 'Parent Org', parentOrgId: null });
    const child = await this.orgRepo.save({ name: 'Child Org', parentOrgId: parent.id });

    const hash = (pw: string) => bcrypt.hash(pw, 10);

    await this.userRepo.save([
      { email: 'owner@test.com', passwordHash: await hash('password'), role: UserRole.OWNER, organizationId: parent.id },
      { email: 'admin@test.com', passwordHash: await hash('password'), role: UserRole.ADMIN, organizationId: parent.id },
      { email: 'viewer@test.com', passwordHash: await hash('password'), role: UserRole.VIEWER, organizationId: child.id },
    ]);

    // eslint-disable-next-line no-console
    console.log('Seeded users: owner@test.com / admin@test.com / viewer@test.com (password: password)');
  }
}
