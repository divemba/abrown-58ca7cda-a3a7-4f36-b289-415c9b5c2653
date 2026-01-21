# abrown-58ca7cda-a3a7-4f36-b289-415c9b5c2653

## Secure Task Management System (NX Monorepo)

A full-stack task management system built with Nx, NestJS, Angular, and SQLite, featuring JWT authentication, role-based access control (RBAC), organization scoping, and audit logging.

## Setup Instructions

Install Dependencies

```bash
# under <root>
npm install 

npx nx serve api # starts backend

npx nx serve dashboard # starts frontend
```

> [!NOTE]
> Users are seeded into the database when you start the server. Their email & password can be used to authenticate with the service.

| Role   | Email                                     | Password |
| ------ | ----------------------------------------- | -------- |
| Owner  | [owner@test.com](mailto:owner@test.com)   | password |
| Admin  | [admin@test.com](mailto:admin@test.com)   | password |
| Viewer | [viewer@test.com](mailto:viewer@test.com) | password |

## Architecture Overview

This project is structed as an [Nx monorepo](https://nx.dev/docs/getting-started/start-new-project), allowing the backend and frontend to live in a single repository while remaining logically isolated.

```graphql
apps/
  api/            # NestJS backend (REST API)
  dashboard/      # Angular frontend (standalone components)

libs/
  auth/           # Authentication, authorization & RBAC utilities
  data/           # Shared domain types & DTOs (extensible)
```

### Shared Libraries

`libs/auth`

This library centralizes **authentication and authorization** logic so it can be reused consistently.

Contains:

- JWT guards
- Permission decorators
- Role helpers
- Shared auth types

## Data Model Explanation

The data model is designed to support **multi-organization task mangement, role-based access control,** and **auditing**, while remaining simple and extensible.

The system is centered around four primary entities:

- User
- Organization
- Task
- AuditLog

### Entity Relationship Diagram

```
┌───────────────┐
│ Organization  │
│───────────────│
│ id            │
│ name          │
│ parentOrgId   │◄──────────────┐
└───────┬───────┘               │
        │                       │
        │                       │
┌───────▼────────┐      ┌───────┴────────┐
│     User        │      │   Organization │
│────────────────│      │   (child)      │
│ id             │      │ id             │
│ email          │      │ parentOrgId    │
│ role           │      └────────────────┘
│ organizationId │
└───────┬────────┘
        │
        │
┌───────▼────────┐
│     Task        │
│────────────────│
│ id             │
│ title          │
│ description    │
│ category       │
│ status         │
│ order          │
│ organizationId │
│ ownerId        │
│ createdAt      │
│ updatedAt      │
└───────┬────────┘
        │
        │
┌───────▼────────┐
│   AuditLog     │
│────────────────│
│ id             │
│ action         │
│ entity         │
│ entityId       │
│ userId         │
│ timestamp      │
│ metadata       │
└────────────────┘

```

## Access Control Implementation

The system implements RBAC combined with organization scoping and JWT authentication to ensure users can only access data they are explicitly authorizer to view or modify.

### Roles & Permissions

| Role       | Capabilities                                                             |
| ---------- | ------------------------------------------------------------------------ |
| **Owner**  | Full read/write access across their organization and child organizations |
| **Admin**  | Read/write access within scope (same as Owner for tasks)                 |
| **Viewer** | Read-only access to tasks in their own organization                      |

Roles are stored on the **User** entity and are embedded into JWTs at login time.

#### Permission Model

Permissions are derived from roles rather than stored independently:

- Role -> Permission mapping
- Simple, predictable behavior
- Easy to extend to fine-grained permissions later

Example:

- `Viewer` -> `task:read`
- `Admin` / `Owner` -> `task:read`, `task:write`

### JWT Authentication Flow

Login:

- User submits email and password
- Credentials are validated
- A JWT access token is issued

The token includes:

- `id` (userId)
- `role`
- `organizationId`
- `email`

#### Authorization Endpoint

Authorization happens at multiple layers:

1. Route-Level Protection

- Guards ensure the request is authenticated
- Permission decorators protect sensitive routes

2. Service-Level Enforcement

Even if a route is accessible, data acess is still verified:

- Organization scope is checked
- Ownership and role constraints are enforced

## API Documentation

Base URL (local): `http://localhost:3000/api`

### Authentication

#### Login

`POST /auth/login`

Authenticates a user and returns a JWT access token.

Request

```json
{
  "email": "owner@test.com",
  "password": "password"
}
```

Response

```json
{
  "accessToken": "eyJh..."
}
```

### Tasks API

#### List Tasks

`GET /tasks`

Returns tasks visible to the authenticated user based on role and organization scope.

Query Parameters (optional)

| Parameter  | Type                         | Description        |
| ---------- | ---------------------------- | ------------------ |
| `category` | string                       | Filter by category |
| `status`   | `Todo \| InProgress \| Done` | Filter by status   |

Request

```http
GET /api/tasks?status=Todo
Authorization: Bearer <token>
```

Response

```json
[
  {
    "id": 1,
    "title": "Set up CI pipeline",
    "description": "Initial GitHub Actions config",
    "category": "Work",
    "status": "Todo",
    "order": 0,
    "organizationId": 1,
    "ownerId": 1,
    "createdAt": "2024-01-10T20:22:11.000Z",
    "updatedAt": "2024-01-10T20:22:11.000Z"
  }
]
```

#### Create Task

`POST /tasks`

Creates a new task in the user's organization.

Request

```json
{
  "title": "Write documentation",
  "category": "Work",
  "description": "API and architecture docs",
  "status": "Todo"
}
```

Response

```json
{
  "id": 5,
  "title": "Write documentation",
  "category": "Work",
  "description": "API and architecture docs",
  "status": "Todo",
  "order": 0,
  "organizationId": 1,
  "ownerId": 1,
  "createdAt": "2024-01-11T18:04:02.000Z",
  "updatedAt": "2024-01-11T18:04:02.000Z"
}
```

#### Update Task

`PUT /tasks/:id`

Updates task fields such as title, status, or order.

Request

```json
{
  "status": "InProgress",
  "order": 1
}
```

Response

```json
{
  "id": 5,
  "title": "Write documentation",
  "category": "Work",
  "description": "API and architecture docs",
  "status": "InProgress",
  "order": 1,
  "updatedAt": "2024-01-11T18:12:09.000Z"
}
```

#### Delete Task

`DELETE /tasks/:id`

Deletes a task

Request

```http
DELETE /api/tasks/5
Authorization: Bearer <token>
```

Response

```json
{
  "deleted": true
}
```

## Future Considerations

- Multi-role users per organization
- Custom roles defined per organization
- Delegated permissions, e.g.:
    - task:approve
    - task:assign
    - audit:export
- Temporary or conditional permissions (time-boxed access)

### JWT Refresh Tokens

- Short-lived access tokens (e.g., 15-30 minutes)
- Long-lived refresh tokens stored securely (HTTP-only cookies)
- Token rotation to mitigate replay attacks

In a production environment, authentication and initial authorization can be shifted out of the application layer and into Azure AD (Entra ID), using Azure AD Groups and Application Service Principals as the source of truth for access. The backend would trust validated identity tokens and focus primarily on resource-level authorization (org scoping, ownership rules, task-level checks).

Proposed flow:

- User signs in via Azure AD (OAuth2/OIDC).
- Frontend receives tokens (ID token + Access token).
- Requests go through AWS API Gateway.
- API Gateway uses an Authorizer (JWT authorizer or Lambda authorizer) to validate token + claims.
- Authorizer injects identity/claims context into the request.
- NestJS backend uses those claims to enforce RBAC + org scoping.

### Terraform (IaC Automation)

Infrastructure would be defined and version-controlled using Terraform to ensure environments are reproducible and auditable.

What Terraform would manage:

- API hosting (container/Lambda) + networking
- Database (managed Postgres in prod; SQLite remains dev-only)
- Secrets management (JWT/AAD config, DB credentials)
- API Gateway configuration + authorizers
- Logging/monitoring (structured logs + audit retention)
- Environment separation (dev/stage/prod) with consistent modules

### Testing (Backend & Frontend)

The application is designed with full test coverage in mind across both services. The backend uses Jest to validate RBAC enforcement, organization scoping, task mutation rules, and end-to-end API behavior with authenticated and unauthorized flows, while the frontend uses Jest to ensure login, task rendering, filtering, optimistic UI updates, and role-based UI restrictions behave correctly. Together, these suites ensure confidence in both business logic and user experience, with optional E2E tests covering real user workflows end to end.

### GitHub Actions (Quality Gates)

A CI pipeline can validate correctness on every PR and main branch push.

- `lint` → Nx ESLint checks (nx run-many -t lint)
- `format` → Prettier formatting validation (fail if not formatted)
- `test` → Jest unit tests for backend + frontend (nx run-many -t test)
- `build` → ensure apps compile (nx run-many -t build)
- `e2e` (optional but ideal) → end-to-end / integration suite (Cypress/Playwright, or API integration tests)
