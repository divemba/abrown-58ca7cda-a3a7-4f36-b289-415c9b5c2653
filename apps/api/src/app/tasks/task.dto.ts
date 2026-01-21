import { TaskStatus } from '../entities/task.entity';

export type CreateTaskDto = {
  title: string;
  description?: string;
  category: string;
  status?: TaskStatus;
};

export type UpdateTaskDto = Partial<CreateTaskDto> & {
  order?: number;
};
