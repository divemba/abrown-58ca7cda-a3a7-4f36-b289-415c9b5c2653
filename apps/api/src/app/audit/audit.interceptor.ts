import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id?: number } | undefined;

    const action = req.method;
    const resource = req.route?.path ?? req.originalUrl ?? 'unknown';
    const resourceId = req.params?.id ? Number(req.params.id) : undefined;

    const write = async (allowed: boolean) => {
      await this.auditRepo.save({
        userId: user?.id ?? 0,
        action,
        resource,
        resourceId,
        allowed,
      });
      // also print to console (meets "console or file")
      // eslint-disable-next-line no-console
      console.log(`[AUDIT] user=${user?.id ?? 'anon'} allowed=${allowed} ${action} ${resource}`);
    };

    return next.handle().pipe(
      tap(() => void write(true)),
      catchError((err) => {
        void write(false);
        return throwError(() => err);
      }),
    );
  }
}
