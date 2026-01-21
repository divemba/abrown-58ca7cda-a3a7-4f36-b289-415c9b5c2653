import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '@abrown/auth';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @RequirePermissions('task:read')
  @Get()
  list(@Req() req: any, @Query('category') category?: string, @Query('status') status?: string) {
    return this.tasks.list(req.user, { category, status });
  }

  @RequirePermissions('task:create')
  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasks.create(req.user, dto);
  }

  @RequirePermissions('task:update')
  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(req.user, Number(id), dto);
  }

  @RequirePermissions('task:delete')
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tasks.remove(req.user, Number(id));
  }
}
