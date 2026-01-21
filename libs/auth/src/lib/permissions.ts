export type Permission =
  | 'task:create'
  | 'task:read'
  | 'task:update'
  | 'task:delete'
  | 'audit:read';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  Owner: ['task:create', 'task:read', 'task:update', 'task:delete', 'audit:read'],
  Admin: ['task:create', 'task:read', 'task:update', 'task:delete', 'audit:read'],
  Viewer: ['task:read'],
};

export function hasPermissions(role: string, required: Permission[]) {
  const allowed = new Set(ROLE_PERMISSIONS[role] ?? []);
  return required.every((p) => allowed.has(p));
}
