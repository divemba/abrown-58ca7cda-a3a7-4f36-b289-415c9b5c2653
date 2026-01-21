import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequirePermissions } from '@abrown/auth';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Controller('audit-log')
export class AuditController {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  @RequirePermissions('audit:read')
  @Get()
  list() {
    return this.auditRepo.find({ order: { timestamp: 'DESC' } });
  }
}
