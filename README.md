# 🚀 FlowBoard — Project Management SaaS

A **full-stack project management application** inspired by Trello and Jira, featuring **Kanban boards, real-time collaboration, and role-based access control**.

⚡ Built with **MERN Stack + Socket.IO + Drag & Drop**

---

## 🌟 Key Features

* 🔐 JWT Authentication & Protected Routes
* 🏢 Workspaces with role-based access (Admin / Member / Viewer)
* 📁 Projects with progress tracking & priorities
* 📋 Kanban Board (Todo → In Progress → Review → Done)
* 🃏 Task Management (CRUD, due dates, assignments, priorities)
* 💬 Comments & ✅ Checklists inside tasks
* 🖱️ Drag & Drop (Kanban interaction)
* ⚡ Real-time updates using Socket.IO
* 🔍 Search & filter tasks
* 📊 Dashboard with task insights

---

## 🛠️ Tech Stack

**Frontend:** React, Vite, Axios
**Backend:** Node.js, Express.js
**Database:** MongoDB (Mongoose)
**Real-time:** Socket.IO
**Other:** JWT Auth, bcrypt, express-validator

---

## 🚀 Getting Started

```bash
# Clone project
git clone <your-repo-link>

# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🗄️ Environment Variables

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

---

## 📡 API Overview

* `/api/auth` → Authentication
* `/api/workspaces` → Workspace management
* `/api/projects` → Project management
* `/api/tasks` → Task operations

---

## 🌐 Live Demo

* 🔗 Frontend: https://flow-board-project-management-saa-s.vercel.app/
* 🔗 Backend: https://flowboard-project-management-backend.onrender.com

---

## 🎯 Highlights

* Real-time multi-user collaboration
* Drag-and-drop Kanban board
* Scalable backend architecture
* Clean UI with responsive design

---

## 📌 Author

**Yogesh Pande**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
