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
    <div class="page">
      <div class="shell">
        <!-- Topbar -->
        <div class="topbar">
          <div class="topbar-left">
            <div class="brand">Task Board</div>
            <div class="subtitle">A simplified Task management board</div>
          </div>

          <div class="topbar-right">
            <span class="role-pill" [class.readonly]="!canWrite">
              {{ canWrite ? 'Owner/Admin' : 'Viewer (read-only)' }}
            </span>
            <button class="link-btn" (click)="logout()">Logout</button>
          </div>
        </div>

        <!-- Create + Filters -->
        <div class="panel">
          <div class="panel-grid">
            <div class="field lg-2">
              <label class="label">Title</label>
              <input
                class="input"
                placeholder="Add a title…"
                [(ngModel)]="title"
              />
            </div>

            <div class="field lg-2">
              <label class="label">Category</label>
              <input
                class="input"
                placeholder="Work / Personal"
                [(ngModel)]="category"
              />
            </div>

            <div class="field lg-2">
              <label class="label">Description</label>
              <input
                class="input"
                placeholder="Optional…"
                [(ngModel)]="description"
              />
            </div>

            <div class="field lg-2">
              <label class="label">Filter Category</label>
              <select class="select" [(ngModel)]="filterCategory">
                <option value="">All categories</option>
                <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
              </select>
            </div>

            <div class="field lg-2">
              <label class="label">Filter Status</label>
              <select class="select" [(ngModel)]="filterStatus">
                <option value="">All statuses</option>
                <option value="Todo">Todo</option>
                <option value="InProgress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div class="actions lg-2">
              <button
                class="btn primary"
                (click)="create()"
                [disabled]="saving || !title || !category || !canWrite"
              >
                {{ saving ? 'Saving…' : 'Create' }}
              </button>

              <button class="btn ghost" (click)="load()">Refresh</button>
            </div>
          </div>

          <p class="hint" *ngIf="!canWrite">
            You have Viewer access — you can view tasks but can’t create/edit/delete.
          </p>

          <p class="error" *ngIf="error">{{ error }}</p>
        </div>

        <!-- Edit panel -->
        <div *ngIf="editing" class="panel panel-edit">
          <div class="panel-head">
            <div class="panel-title">Edit Task #{{ editing.id }}</div>
            <button class="link-btn" (click)="cancelEdit()">Close</button>
          </div>

          <div class="panel-grid">
            <div class="field lg-2">
              <label class="label">Title</label>
              <input class="input" [(ngModel)]="editTitle" />
            </div>

            <div class="field lg-2">
              <label class="label">Category</label>
              <input class="input" [(ngModel)]="editCategory" />
            </div>

            <div class="field lg-2">
              <label class="label">Description</label>
              <input class="input" [(ngModel)]="editDescription" />
            </div>

            <div class="field lg-2">
              <label class="label">Status</label>
              <select class="select" [(ngModel)]="editStatus">
                <option value="Todo">Todo</option>
                <option value="InProgress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div class="actions lg-2">
              <button
                class="btn primary"
                (click)="saveEdit()"
                [disabled]="savingEdit || !editTitle || !editCategory"
              >
                {{ savingEdit ? 'Saving…' : 'Save changes' }}
              </button>

              <button class="btn ghost" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>

          <p class="error" *ngIf="editError">{{ editError }}</p>
        </div>

        <!-- Board -->
        <div class="board">
          <div
            *ngFor="let col of columns"
            class="column"
            [attr.data-status]="col.key"
          >
            <div class="col-head">
              <div class="col-title">{{ col.title }}</div>
              <div class="count">{{ col.items.length }}</div>
            </div>

            <div
              class="dropzone"
              cdkDropList
              [id]="col.id"
              [cdkDropListData]="col.items"
              [cdkDropListConnectedTo]="connectedIds"
              (cdkDropListDropped)="drop(col.key, $event)"
            >
              <div
                *ngFor="let t of col.items; trackBy: trackById"
                cdkDrag
                [cdkDragDisabled]="!canWrite"
                class="card"
                [class.readonly]="!canWrite"
              >
                <div class="card-top">
                  <div class="card-title">{{ t.title }}</div>

                  <div class="card-actions" *ngIf="canWrite">
                    <button class="icon-btn" (click)="startEdit(t)">Edit</button>
                    <button class="icon-btn danger" (click)="remove(t.id)">Delete</button>
                  </div>
                </div>

                <div class="card-meta">
                  <span class="tag">{{ t.category }}</span>
                  <span class="dot">•</span>
                  <span class="muted">#{{ t.id }}</span>
                </div>

                <div class="card-desc" *ngIf="t.description">{{ t.description }}</div>
              </div>

              <div class="empty" *ngIf="col.items.length === 0">
                Drop tasks here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './tasks-page.component.css',
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
