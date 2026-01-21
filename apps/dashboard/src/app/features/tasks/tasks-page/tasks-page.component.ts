import { finalize } from 'rxjs/operators';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TasksService, Task, TaskStatus } from '../tasks.service';
import { AuthService } from '../../auth/auth.service';

type Column = { id: string; key: TaskStatus; title: string; items: Task[] };

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-semibold">Task Dashboard</h1>
          <button class="text-sm underline" (click)="logout()">Logout</button>
        </div>

        <!-- Create + Filters -->
        <div class="rounded-lg border bg-white p-4 mb-4">
          <div class="grid gap-3 lg:grid-cols-6">
            <input class="border rounded px-3 py-2 lg:col-span-2"
              placeholder="Title" [(ngModel)]="title" />

            <input class="border rounded px-3 py-2 lg:col-span-2"
              placeholder="Category (Work/Personal)" [(ngModel)]="category" />

            <input class="border rounded px-3 py-2 lg:col-span-2"
              placeholder="Description (optional)" [(ngModel)]="description" />

            <select class="border rounded px-3 py-2 lg:col-span-2"
              [(ngModel)]="filterCategory">
              <option value="">All categories</option>
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>

            <select class="border rounded px-3 py-2 lg:col-span-2"
              [(ngModel)]="filterStatus">
              <option value="">All statuses</option>
              <option value="Todo">Todo</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>

            <div class="flex gap-2 lg:col-span-2">
              <button
                class="flex-1 rounded px-3 py-2 bg-black text-white disabled:opacity-60"
                (click)="create()"
                [disabled]="saving || !title || !category || !canWrite">
                {{ saving ? 'Saving…' : 'Create' }}
              </button>

              <p class="text-xs text-gray-500 mt-2" *ngIf="!canWrite">
                You have Viewer access (read-only).
              </p>

              <button class="rounded px-3 py-2 border"
                (click)="load()">
                Refresh
              </button>
            </div>
          </div>

          <p class="text-sm text-red-600 mt-2" *ngIf="error">{{ error }}</p>
        </div>

        <!-- Edit panel -->
        <div *ngIf="editing" class="rounded-lg border bg-white p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <div class="font-medium">Edit Task #{{ editing.id }}</div>
            <button class="text-sm underline" (click)="cancelEdit()">Close</button>
          </div>

          <div class="grid gap-3 lg:grid-cols-6">
            <input class="border rounded px-3 py-2 lg:col-span-2"
              placeholder="Title" [(ngModel)]="editTitle" />

            <input class="border rounded px-3 py-2 lg:col-span-2"
              placeholder="Category" [(ngModel)]="editCategory" />

            <input class="border rounded px-3 py-2 lg:col-span-2"
              placeholder="Description" [(ngModel)]="editDescription" />

            <select class="border rounded px-3 py-2 lg:col-span-2"
              [(ngModel)]="editStatus">
              <option value="Todo">Todo</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>

            <div class="lg:col-span-4 flex gap-2">
              <button class="rounded px-3 py-2 bg-black text-white disabled:opacity-60"
                (click)="saveEdit()"
                [disabled]="savingEdit || !editTitle || !editCategory">
                {{ savingEdit ? 'Saving…' : 'Save changes' }}
              </button>

              <button class="rounded px-3 py-2 border" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>

          <p class="text-sm text-red-600 mt-2" *ngIf="editError">{{ editError }}</p>
        </div>


        <!-- Board -->
        <div class="grid gap-4 lg:grid-cols-3">
          <div *ngFor="let col of columns" class="rounded-lg border bg-white">
            <div class="p-3 border-b flex items-center justify-between">
              <div class="font-medium">{{ col.title }}</div>
              <div class="text-xs text-gray-500">{{ col.items.length }}</div>
            </div>

            <div class="p-3 min-h-[200px]"
              cdkDropList
              [id]="col.id"
              [cdkDropListData]="col.items"
              [cdkDropListConnectedTo]="connectedIds"
              (cdkDropListDropped)="drop(col.key, $event)">
              <div *ngFor="let t of col.items; trackBy: trackById"
                   cdkDrag
                   [cdkDragDisabled]="!canWrite"
                   class="mb-3 last:mb-0 rounded border bg-white p-3 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-medium truncate">{{ t.title }}</div>
                    <div class="text-sm text-gray-600">{{ t.category }}</div>
                    <div class="text-sm text-gray-500 mt-1" *ngIf="t.description">{{ t.description }}</div>
                  </div>
                  <div class="flex gap-3">
                    <button class="text-sm underline" *ngIf="canWrite" (click)="startEdit(t)">Edit</button>
                    <button class="text-sm text-red-600 underline" *ngIf="canWrite" (click)="remove(t.id)">Delete</button>
                  </div>
                </div>
              </div>

              <div class="text-sm text-gray-400" *ngIf="col.items.length === 0">
                Drop tasks here
              </div>
            </div>
          </div>
        </div>

        <p class="text-xs text-gray-500 mt-4">
          Tip: Drag tasks between columns to change status, and within a column to reorder.
        </p>
      </div>
    </div>
  `,
})
export class TasksPageComponent {
  tasks: Task[] = [];

  title = '';
  category = '';
  description = '';
  saving = false;
  error = '';

  filterCategory = '';
  filterStatus: '' | TaskStatus = '';

  editing: Task | null = null;

  editTitle = '';
  editCategory = '';
  editDescription = '';
  editStatus: TaskStatus = 'Todo';

  savingEdit = false;
  editError = '';

  columns: Column[] = [
    { id: 'todoList', key: 'Todo', title: 'Todo', items: [] },
    { id: 'inProgressList', key: 'InProgress', title: 'In Progress', items: [] },
    { id: 'doneList', key: 'Done', title: 'Done', items: [] },
  ];

  constructor(
    private tasksSvc: TasksService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.load();
  }

  get categories() {
    const set = new Set(this.tasks.map(t => t.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  // CDK connected lists (we use the arrays themselves)
  get dropLists() {
    return this.columns.map(c => c.items);
  }

  get connectedIds() {
    return this.columns.map((c) => c.id);
  }

  get canWrite() {
    return this.auth.isAdminLike(); // Owner/Admin
  }

  trackById(_: number, t: Task) {
    return t.id;
  }

  load() {
    this.error = '';

    this.tasksSvc.list({
      category: this.filterCategory || undefined,
      status: this.filterStatus || undefined,
    }).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.rebuildColumns();
      },
      error: (e) => (this.error = e?.error?.message ?? 'Failed to load tasks'),
    });
  }

  rebuildColumns() {
    for (const col of this.columns) col.items.length = 0;

    const sorted = [...this.tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const t of sorted) {
      const col = this.columns.find(c => c.key === t.status) ?? this.columns[0];
      col.items.push(t);
    }
  }

  create() {
    this.saving = true;
    this.error = '';

    this.tasksSvc.create({
      title: this.title,
      category: this.category,
      description: this.description || undefined,
      status: 'Todo',
    }).subscribe({
      next: () => {
        this.title = '';
        this.category = '';
        this.description = '';
        this.load();
      },
      error: (e) => {
        this.error = e?.error?.message ?? 'Failed to create task (are you Viewer?)';
        this.saving = false;
      },
      complete: () => (this.saving = false),
    });
  }

  remove(id: number) {
    this.tasksSvc.remove(id).subscribe({
      next: () => this.load(),
      error: (e) => (this.error = e?.error?.message ?? 'Failed to delete task'),
    });
  }

  drop(targetStatus: TaskStatus, event: CdkDragDrop<Task[]>) {
    // reorder within a column
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.persistColumnOrder(targetStatus, event.container.data);
      return;
    }

    // move between columns
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const moved = event.container.data[event.currentIndex];

    // update status first, then persist order
    this.tasksSvc.update(moved.id, { status: targetStatus }).subscribe({
      next: () => this.persistColumnOrder(targetStatus, event.container.data),
      error: (e) => (this.error = e?.error?.message ?? 'Failed to update task status'),
    });
  }

  persistColumnOrder(status: TaskStatus, colTasks: Task[]) {
    // set local order by position
    colTasks.forEach((t, idx) => (t.order = idx));

    // persist each task's order (+ status to be safe)
    colTasks.forEach((t) => {
      this.tasksSvc.update(t.id, { order: t.order, status }).subscribe({
        error: () => (this.error = 'Failed to persist order (refresh to recover)'),
      });
    });
  }

  startEdit(t: Task) {
    this.editing = t;
    this.editTitle = t.title;
    this.editCategory = t.category;
    this.editDescription = t.description ?? '';
    this.editStatus = t.status;
    this.editError = '';
  }

  cancelEdit() {
    this.editing = null;
    this.editError = '';
  }

  saveEdit() {
    if (!this.editing) return;

    this.savingEdit = true;
    this.editError = '';

    const id = this.editing.id;

    const optimistic: Task = {
      ...this.editing,
      title: this.editTitle,
      category: this.editCategory,
      description: this.editDescription || undefined,
      status: this.editStatus,
    };

    this.tasks = this.tasks.map((t) => (t.id === id ? optimistic : t));
    this.rebuildColumns();

    this.editing = null;

    this.tasksSvc
      .update(id, {
        title: this.editTitle,
        category: this.editCategory,
        description: this.editDescription || undefined,
        status: this.editStatus,
      })
      .pipe(finalize(() => (this.savingEdit = false)))
      .subscribe({
        next: (updated: any) => {
          if (updated && typeof updated === 'object' && 'id' in updated) {
            this.tasks = this.tasks.map((t) => (t.id === updated.id ? (updated as Task) : t));
            this.rebuildColumns();
          }
        },
        error: (e) => {
          this.editError = e?.error?.message ?? 'Failed to update task';
        },
      });
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
