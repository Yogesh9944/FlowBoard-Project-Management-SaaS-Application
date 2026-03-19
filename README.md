# 🚀 FlowBoard — Project Management SaaS

A full-stack, production-grade project management application built with the MERN stack. Inspired by Trello and Jira, FlowBoard lets teams manage workspaces, projects, and tasks with a beautiful Kanban board interface.

---

## ✨ Features

### Core
- 🔐 **JWT Authentication** — Register, login, logout, protected routes
- 🏢 **Workspaces** — Create multiple workspaces, invite members, assign roles (Admin / Member / Viewer)
- 📁 **Projects** — Create projects with progress tracking, priority, icons, and color themes
- 📋 **Kanban Boards** — Default columns: Todo → In Progress → In Review → Done
- 🃏 **Task Management** — Full CRUD: title, description, status, priority, due dates, assignments
- 💬 **Comments** — Comment on tasks with emoji reactions
- ✅ **Checklists** — Add checklist items inside tasks with progress tracking
- 📊 **Dashboard** — Overview of your tasks, overdue items, and project progress

### Advanced
- 🖱️ **Drag & Drop** — Move tasks between columns using `@hello-pangea/dnd`
- ⚡ **Real-time Updates** — Live task creation/movement/deletion via Socket.IO
- 🔔 **Activity Log** — Track every change made to a task
- 🔍 **Search & Filter** — Search tasks by title, filter by priority
- 🎭 **Role-Based Access** — Admin, Member, Viewer per workspace
- 👤 **Profile Settings** — Update name, avatar, and password
- 📱 **Responsive** — Works on desktop and tablet

---

## 🛠️ Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Frontend   | React 18, React Router v6, Axios          |
| UI         | Custom CSS (no external UI library)        |
| Drag & Drop | @hello-pangea/dnd                         |
| Real-time  | Socket.IO Client                          |
| Backend    | Node.js, Express.js                        |
| Auth       | JWT + bcryptjs                             |
| Validation | express-validator                          |
| Database   | MongoDB + Mongoose                         |
| Real-time  | Socket.IO                                  |
| Build Tool | Vite                                       |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Setup Backend

```bash
cd backend
npm install

# Create .env from template
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm run dev
# Server starts on http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
# App starts on http://localhost:3000
```

---

## 🗄️ Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/flowboard
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

---

## 📐 Database Schema

```
User          → name, email, password, avatar, role
Workspace     → name, icon, color, owner, members[{user, role}]
Project       → title, description, workspace, owner, members, priority, status
Board         → name, project, workspace, order, color, isDefault
Task          → title, description, board, project, status, priority,
                assignedTo[], dueDate, checklist[], activity[], attachments[]
Comment       → task, user, text, reactions[], isEdited
```

---

## 🔌 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Workspaces
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/workspaces` | Get user's workspaces |
| POST | `/api/workspaces` | Create workspace |
| PUT | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| POST | `/api/workspaces/:id/invite` | Invite member |
| DELETE | `/api/workspaces/:id/members/:userId` | Remove member |

### Projects
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/projects/workspace/:id` | Get projects in workspace |
| POST | `/api/projects` | Create project (auto-creates 4 boards) |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project + boards + tasks |
| GET | `/api/projects/:id/stats` | Get project statistics |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tasks/board/:boardId` | Get tasks in board |
| GET | `/api/tasks/project/:projectId` | Get all tasks in project (with filters) |
| GET | `/api/tasks/my` | Get tasks assigned to me |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PUT | `/api/tasks/:id/move` | Move task to different board |
| PUT | `/api/tasks/:id/checklist/:itemId` | Update checklist item |
| DELETE | `/api/tasks/:id` | Delete task |

---

## 🧩 Project Structure

```
project-manager/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Business logic
│   ├── middleware/       # Auth, error handler
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   └── server.js        # Entry point + Socket.IO
│
└── frontend/
    └── src/
        ├── api/         # Axios instance + service functions
        ├── components/  # Reusable UI components
        │   ├── layout/  # Sidebar, AppLayout
        │   ├── task/    # TaskCard, CreateTaskModal, TaskDetailModal
        │   ├── board/   # CreateBoardModal
        │   ├── project/ # CreateProjectModal
        │   └── workspace/ # CreateWorkspaceModal, InviteMemberModal
        ├── context/     # AuthContext, WorkspaceContext
        ├── hooks/       # useSocket, useProjectSocket
        └── pages/       # Dashboard, Board, MyTasks, Settings, etc.
```

---

## 🎯 Resume Highlights

This project demonstrates:

- **React** — Context API, custom hooks, protected routes, complex state, drag-and-drop
- **Node/Express** — RESTful API design, JWT auth middleware, validation, error handling
- **MongoDB** — Schema design with cross-collection references, aggregation, indexes
- **Socket.IO** — Real-time multi-user board updates
- **Architecture** — Separation of concerns, clean folder structure, scalable patterns

---

## 📸 Screens

- **Login / Register** — Clean auth pages with demo credentials
- **Dashboard** — Task overview, project progress, greeting by time of day
- **Workspace** — Project grid with progress bars and member avatars
- **Kanban Board** — Drag-and-drop columns with task cards
- **Task Detail** — Full task management: description, checklist, assignees, comments, activity log
- **My Tasks** — Grouped by Overdue / Today / Upcoming / No Due Date
- **Settings** — Profile and password management

---

## 🚀 Deployment Tips

- **Backend**: Deploy to Railway, Render, or Fly.io
- **Frontend**: Deploy to Vercel or Netlify (set `VITE_API_URL` env var)
- **Database**: MongoDB Atlas (free tier works)

---

Built with ❤️ as a full-stack MERN portfolio project.
