# Team Task Manager (Full-Stack)

A full-stack web app for team project/task management with authentication, role-based access control, and dashboard tracking.

## Tech Stack
- Backend: Node.js, Express
- Database: SQLite
- ORM: Prisma Client
- Frontend: HTML, CSS, Vanilla JavaScript (served by Express)
- Auth: JWT + bcrypt
- Validation: Zod

## Features
- Signup / Login with JWT auth
- Role-based access (`ADMIN`, `MEMBER`)
- Project management
- Team member assignment to projects
- Task creation, assignment, and status tracking (`TODO`, `IN_PROGRESS`, `DONE`)
- Dashboard summary with overdue task reporting

## RBAC Rules
- `ADMIN`
  - Create projects
  - Add/remove project members
  - View all projects/tasks
  - Update any task
- `MEMBER`
  - View projects where they are a member
  - Create tasks in projects they belong to
  - Update tasks they created
  - Update status for tasks assigned to them
  - Cannot create projects

## Setup
1. Install dependencies
```bash
npm install
```
2. Initialize database schema
```bash
npm run db:init
```
3. Generate Prisma client
```bash
npm run prisma:generate
```
4. Start app
```bash
npm run dev
```

App runs at `http://localhost:4000`.

## API Endpoints
### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Projects
- `GET /api/projects`
- `POST /api/projects` (Admin)
- `GET /api/projects/:projectId`
- `GET /api/projects/:projectId/members`
- `POST /api/projects/:projectId/members` (Admin)
- `DELETE /api/projects/:projectId/members/:userId` (Admin)

### Tasks
- `GET /api/projects/:projectId/tasks`
- `POST /api/projects/:projectId/tasks`
- `PATCH /api/tasks/:taskId`

### Dashboard
- `GET /api/dashboard`

## Environment Variables
Create/update `.env`:
```env
DATABASE_URL="file:C:/atheraai/prisma/dev.db"
JWT_SECRET="super-secret-key-change-me"
PORT=4000
```

Use an absolute `DATABASE_URL` path suitable for your machine.
