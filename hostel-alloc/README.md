# 🏠 HostelOS — Hostel Allocation Management System

> A full-stack **MERN** web application that automates fair and transparent hostel room distribution using a priority-based algorithm with predefined constraints.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel&logoColor=white)

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Priority Algorithm](#-priority-algorithm)
- [API Reference](#-api-reference)
- [Local Setup](#️-local-setup)
- [GitHub Upload Guide](#-github-upload-guide)
- [Vercel Deployment](#-vercel-deployment)
- [Environment Variables](#-environment-variables)
- [Seed Data](#-seed-data)

---

## 📖 About the Project

HostelOS is a database-driven hostel allocation system built to fairly distribute limited hostel rooms among students based on predefined criteria such as CGPA, disability status, family income, year of study, and whether the student is outstation. Admins and wardens can manage students, rooms, run auto-allocation, or assign rooms manually — all from a clean, modern dashboard.

---

## ✅ Features

| Feature | Description |
|---------|-------------|
| 🔐 Auth System | JWT-based login/register for Admin & Warden roles |
| 👥 Student Management | Add, edit, delete students with auto-computed priority scores |
| 🏠 Room Management | Manage rooms with type, floor, gender, amenities & occupancy |
| ⚡ Auto Allocation | One-click algorithm allocates all pending students by priority |
| 🖐 Manual Allocation | Assign any pending student to any available room |
| 📊 Analytics Dashboard | Live charts for occupancy, status, and department breakdown |
| 🔍 Search & Filters | Filter by status, gender, department, room type |
| 📄 Pagination | Handles large datasets efficiently |
| ♿ Accessibility | Physically disabled students get ground-floor accessible rooms |
| 🌙 Dark UI | Sleek dark-themed interface built with custom CSS design system |

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Recharts, Lucide React |
| **Backend** | Node.js, Express.js 4 |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **Deployment** | Vercel (Serverless Functions + Static Build) |

---

## 📁 Project Structure

```
hostel-alloc/
│
├── api/                          # ── Express Backend ──
│   ├── models/
│   │   ├── User.js               # Admin/Warden with hashed passwords
│   │   ├── Student.js            # Student schema + priority score engine
│   │   ├── Room.js               # Room inventory + occupancy tracking
│   │   └── Allocation.js         # Allocation records (auto/manual)
│   ├── routes/
│   │   ├── auth.js               # POST /register, POST /login, GET /me
│   │   ├── students.js           # Full CRUD + priority-ranked list
│   │   ├── rooms.js              # Full CRUD + bulk create
│   │   ├── allocations.js        # Manual + auto-allocation + vacate
│   │   └── dashboard.js          # Stats and chart data
│   ├── middleware/
│   │   └── auth.js               # JWT protect + adminOnly guard
│   └── server.js                 # App entry point, MongoDB connection
│
├── client/                       # ── React Frontend ──
│   ├── public/index.html
│   └── src/
│       ├── context/AuthContext.js # Global auth state (login/logout/user)
│       ├── utils/api.js           # Axios instance + all API calls
│       ├── components/Layout.js   # Sidebar + topbar shell
│       ├── pages/
│       │   ├── Login.js           # Login / Register page
│       │   ├── Dashboard.js       # Stats + charts
│       │   ├── Students.js        # Student management
│       │   ├── Rooms.js           # Room management
│       │   └── Allocations.js     # Allocation management
│       ├── App.js                 # Routes + Auth guard
│       ├── App.css                # Global design system (CSS variables)
│       └── index.js               # React entry point
│
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules
├── vercel.json                    # Vercel deployment config
├── package.json                   # Root scripts
└── README.md
```

---

## 🧠 Priority Algorithm

Every student gets a **priority score** computed automatically before allocation:

```
Priority Score =
  (CGPA × 5)                           → up to 50 pts   academic merit
  + Physical Disability bonus           → +30 pts        highest priority
  + Low income family  (< ₹2L/year)    → +20 pts
  + Mid income family  (₹2L–₹5L/year)  → +10 pts
  + Year seniority: (6 − year) × 3     → up to 15 pts   final year first
  + Outstation student                  → +15 pts        non-local
```

**Auto-Allocation steps:**
1. Fetch all `Pending` students sorted by priority (highest first)
2. For each student, find rooms where:
   - Not full (`currentOccupancy < capacity`)
   - Gender matches or room is `Mixed`
   - If disabled → only ground floor or accessible rooms
   - Preference for requested room type (if specified)
3. Pick the **least-filled** matching room (even distribution across blocks)
4. Create allocation record, update occupancy, mark student as `Allocated`
5. Students with no matching room → marked `Waitlisted`

---

## 🔐 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | ❌ | name, email, password, role | Register new admin |
| POST | `/login` | ❌ | email, password | Login — returns JWT |
| GET | `/me` | ✅ | — | Get current logged-in user |

### Students — `/api/students`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ Admin | List all (paginated, filterable by status/gender/dept) |
| POST | `/` | ✅ Admin | Create student |
| GET | `/:id` | ✅ | Get student by ID |
| PUT | `/:id` | ✅ Admin | Update student |
| DELETE | `/:id` | ✅ Admin | Delete student |
| GET | `/ranked/list` | ✅ Admin | Priority-sorted pending list |

### Rooms — `/api/rooms`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | List all (filterable by status/gender/type/block) |
| POST | `/` | ✅ Admin | Create room |
| POST | `/bulk` | ✅ Admin | Bulk create rooms |
| GET | `/:id` | ✅ | Get room by ID |
| PUT | `/:id` | ✅ Admin | Update room |
| DELETE | `/:id` | ✅ Admin | Delete room |

### Allocations — `/api/allocations`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ Admin | List active allocations |
| POST | `/` | ✅ Admin | Create manual allocation |
| POST | `/auto-allocate` | ✅ Admin | Run priority-based auto-allocation |
| DELETE | `/:id` | ✅ Admin | Vacate / remove allocation |

### Dashboard — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | ✅ Admin | Full stats + chart data for all modules |

---

## ⚙️ Local Setup

### Prerequisites

Install these before starting:
- [Node.js](https://nodejs.org) v18 or higher (`node -v` to check)
- [Git](https://git-scm.com) (`git --version` to check)
- A free [MongoDB Atlas](https://cloud.mongodb.com) account

### Step 1 — Extract & Install

```bash
# Navigate into the project folder
cd hostel-alloc

# Install all dependencies (root + React client)
npm run install-all
```

### Step 2 — Configure Environment

```bash
# Copy the template
cp .env.example .env
```

Edit `.env` with your values:

```env
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.mongodb.net/hostel_alloc
JWT_SECRET=hostelOS_pick_any_very_long_random_string_2024_xyz
PORT=5000
NODE_ENV=development
```

**How to get your MongoDB URI:**
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Create a database user under Security → Database Access
4. Allow access from anywhere under Security → Network Access (`0.0.0.0/0`)
5. Click Connect → Compass → copy the connection string
6. Replace `<password>` with your actual database user password

### Step 3 — Start Development Server

```bash
npm run dev
```

This starts both servers simultaneously:
- **Backend API** → `http://localhost:5000`
- **React Frontend** → `http://localhost:3000`

Open `http://localhost:3000`, register an admin account, and you're in.

---

## 📤 GitHub Upload Guide

Follow these steps to upload your project to GitHub for the first time.

---

### Step 1 — Create a New Repository on GitHub

1. Open [github.com](https://github.com) and log in
2. Click the **"+"** button (top-right corner) → **"New repository"**
3. Fill in the details:
   - **Repository name:** `hostel-allocation-system`
   - **Description:** `MERN stack hostel room allocation system with priority-based auto-allocation`
   - **Visibility:** Public *(or Private — your choice)*
   - ❌ **Do NOT** tick "Add a README file"
   - ❌ **Do NOT** tick "Add .gitignore"
   - ❌ **Do NOT** choose a license here
4. Click **"Create repository"**
5. You will see a page with a URL. Copy it — it looks like:
   ```
   https://github.com/YOUR_USERNAME/hostel-allocation-system.git
   ```

---

### Step 2 — Open Terminal in Your Project Folder

**Windows:** Right-click inside the `hostel-alloc` folder → "Open in Terminal" or "Git Bash Here"

**Mac/Linux:** Open Terminal and run:
```bash
cd ~/Downloads/hostel-alloc
```

Confirm you're in the right place:
```bash
ls
# Should show: api/  client/  package.json  vercel.json  README.md  ...
```

---

### Step 3 — Run These Git Commands (One by One)

```bash
# 1. Initialize git in the project
git init

# 2. Stage all project files
git add .

# 3. Check what's being committed (optional but useful)
git status

# 4. Create your first commit
git commit -m "feat: initial commit — HostelOS MERN hostel allocation system"

# 5. Rename the branch to 'main'
git branch -M main

# 6. Connect to your GitHub repository
#    REPLACE the URL below with YOUR repo URL from Step 1
git remote add origin https://github.com/YOUR_USERNAME/hostel-allocation-system.git

# 7. Push your code to GitHub
git push -u origin main
```

GitHub will ask for your credentials. Enter your GitHub username. For the password, use a **Personal Access Token** (not your account password).

> **How to create a Personal Access Token:**
> 1. GitHub → click your profile photo → Settings
> 2. Scroll down → Developer settings → Personal access tokens → Tokens (classic)
> 3. Click "Generate new token (classic)"
> 4. Give it a name, set expiry, tick the **`repo`** checkbox
> 5. Click "Generate token" and copy it immediately
> 6. Paste this token as the password when Git asks

---

### Step 4 — Verify on GitHub

1. Go to `https://github.com/YOUR_USERNAME/hostel-allocation-system`
2. You should see all your files listed
3. The README.md will render beautifully on the homepage ✅

---

### Step 5 — Pushing Future Changes

Every time you update code and want to push to GitHub:

```bash
git add .
git commit -m "fix: describe what you changed here"
git push
```

---

## 🌐 Vercel Deployment

### Step 1 — Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and click **"Sign Up"**
2. Choose **"Continue with GitHub"** — authorize Vercel

### Step 2 — Import Your Repository

1. On the Vercel dashboard, click **"Add New Project"**
2. Find `hostel-allocation-system` in the list and click **"Import"**
3. On the configuration screen:
   - **Framework Preset:** Select `Other` (NOT Create React App)
   - **Root Directory:** Leave as `.` (default)
   - **Build & Output settings:** Leave all blank (vercel.json handles it)

### Step 3 — Add Environment Variables

Scroll down to **"Environment Variables"** before deploying and add:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://user:password@cluster.mongodb.net/hostel_alloc` |
| `JWT_SECRET` | `your_very_long_random_secret_string` |
| `NODE_ENV` | `production` |

### Step 4 — Deploy

Click **"Deploy"** and wait ~2 minutes. Vercel will:
- Build the React frontend into static files
- Deploy Express routes as serverless functions
- Give you a live URL: `https://hostel-allocation-system.vercel.app` 🎉

### Auto-Deploy

Every future `git push` to GitHub → Vercel automatically redeploys. No manual steps needed.

---

## 🔒 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for signing JWT tokens (make it long & random) |
| `PORT` | ❌ No | Server port — defaults to 5000 (Vercel ignores this) |
| `NODE_ENV` | ❌ No | `development` or `production` |
| `CLIENT_URL` | ❌ No | CORS origin — defaults to `*` if not set |

---

## 🌱 Seed Data

To quickly seed rooms for testing, use the bulk create API. You can call it with Postman or Thunder Client (VS Code extension):

```
POST https://your-app.vercel.app/api/rooms/bulk
Headers: Authorization: Bearer <paste_your_jwt_token_here>
Content-Type: application/json

Body:
{
  "rooms": [
    { "roomNumber": "A-101", "block": "A", "floor": 1, "type": "Double", "capacity": 2, "gender": "Male", "amenities": ["WiFi", "Fan", "Study Table"], "monthlyRent": 3000 },
    { "roomNumber": "A-102", "block": "A", "floor": 1, "type": "Single", "capacity": 1, "gender": "Male", "amenities": ["AC", "WiFi", "Attached Bathroom"], "monthlyRent": 5500 },
    { "roomNumber": "A-103", "block": "A", "floor": 0, "type": "Single", "capacity": 1, "gender": "Male", "amenities": ["Fan", "Study Table"], "isAccessible": true, "monthlyRent": 2500 },
    { "roomNumber": "B-101", "block": "B", "floor": 0, "type": "Single", "capacity": 1, "gender": "Female", "amenities": ["AC", "WiFi"], "isAccessible": true, "monthlyRent": 5000 },
    { "roomNumber": "B-102", "block": "B", "floor": 1, "type": "Double", "capacity": 2, "gender": "Female", "amenities": ["WiFi", "Fan", "Wardrobe"], "monthlyRent": 3200 },
    { "roomNumber": "B-201", "block": "B", "floor": 2, "type": "Triple", "capacity": 3, "gender": "Female", "amenities": ["Fan", "Study Table"], "monthlyRent": 1800 }
  ]
}
```

Get your JWT token by calling `POST /api/auth/login` first.

---

## 🤝 Contributing

1. Fork the repository on GitHub
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Built with ❤️ using the MERN stack — MongoDB, Express, React, Node.js.

> ⭐ If this project helped you, please give it a star on GitHub!
