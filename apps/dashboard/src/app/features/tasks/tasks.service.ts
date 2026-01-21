import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_BASE_URL } from '../../core/api.config';

export type TaskStatus = 'Todo' | 'InProgress' | 'Done';

export type Task = {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: TaskStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
};

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private http: HttpClient) {}

  list(filters?: { category?: string; status?: TaskStatus }) {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.status) params = params.set('status', filters.status);

    return this.http.get<Task[]>(`${API_BASE_URL}/tasks`, { params });
  }

  create(input: { title: string; category: string; description?: string; status?: TaskStatus }) {
    return this.http.post<Task>(`${API_BASE_URL}/tasks`, input);
  }

  update(
    id: number,
    patch: Partial<Pick<Task, 'title' | 'description' | 'category' | 'status' | 'order'>>,
  ) {
    return this.http.put<Task>(`${API_BASE_URL}/tasks/${id}`, patch);
  }

  remove(id: number) {
    return this.http.delete(`${API_BASE_URL}/tasks/${id}`);
  }
}
