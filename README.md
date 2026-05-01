# Team Task Manager

Full-stack team task management app with JWT auth, role-based access control, project membership, task tracking, and dashboard metrics.

## Live App
- https://etharaai-production-9bfe.up.railway.app/

## Tech Stack
- Backend: Node.js, Express
- Database: SQLite
- ORM: Prisma Client
- Frontend: HTML, CSS, Vanilla JavaScript
- Auth: JWT + bcrypt
- Validation: Zod

## Features
- User signup/login and separate admin signup/login flows
- RBAC with `ADMIN` and `MEMBER` roles
- Project creation and member management
- Task creation, assignment, and status updates (`TODO`, `IN_PROGRESS`, `DONE`)
- Dashboard summary with overdue tasks

## RBAC
- `ADMIN`
  - Create projects
  - Add/remove project members
  - View all projects/tasks
  - Update any task
- `MEMBER`
  - View projects they belong to
  - Create tasks in their projects
  - Update tasks they created
  - Update status for tasks assigned to them
  - Cannot create projects

## Local Setup
1. Install dependencies:
```bash
npm install
```
2. Configure required environment variables in your local runtime.
3. Initialize DB schema and Prisma client:
```bash
npm run setup
```
4. Start app:
```bash
npm run dev
```

App runs on `http://localhost:4000`.

## Notes on Accounts
- There are no default seeded users or credentials in this repository.
- Create your first admin account from the app UI or by calling:
  - `POST /api/auth/admin/signup`

## Railway Deployment (SQLite + Volume)
1. Deploy this GitHub repo to Railway.
2. Add a Railway Volume and mount it at `/app/data`.
3. Configure required service variables in Railway.
4. Set commands:
  - Build: `npm ci && npm run prisma:generate`
  - Start: `npm run db:init && npm start`

The server also initializes SQLite schema on startup for `file:` databases.

## Health Check
- `GET /health`

## API Endpoints
### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/admin/signup`
- `POST /api/auth/admin/login`
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
