import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionsGuard } from '@abrown/auth';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UsersModule } from './users/users.module';

import { SeedService } from './seed.service';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { TasksModule } from './tasks/tasks.module';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditLog } from './entities/audit-log.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuditModule,
    TypeOrmModule.forFeature([User, Organization, AuditLog]),


    TypeOrmModule.forFeature([User, Organization]),

    UsersModule,
    AuthModule,
    TasksModule,
  ],
  providers: [
    SeedService,

    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
