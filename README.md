# LuminaLib — Full Stack Library Management System

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

A professional, industry-grade Full Stack Library Management System designed for librarians and administrators. LuminaLib simplifies book inventory management, member registries, book checkouts, holds, returns, and real-time dashboard analytics. Built with secure cookies, schema-validated inputs, and a modern glassmorphic dashboard interface.

---

## Project Overview

LuminaLib solves the administrative challenges of managing physical library ecosystems. By utilizing a decoupled **React/Vite client** and an **Express/Node/MongoDB API**, it enforces reliable business logic (unique Card IDs, check-out blockades on overdue fines, holds queue priority, and validation checks) while delivering an ultra-smooth, responsive user experience. 

It is ideal for portfolios, exhibiting production-grade practices like JWT sessions stored in HTTP-only cookies, robust central Express error handlers, and rigorous input validations using Joi schemas.

---

## Features

- 📊 **Dynamic Dashboard & Analytics**: Real-time stats showing total books, active loans, overdue items, and library members. Integrated trend charts (weekly checkout volumes and category distributions) using **Recharts**.
- 📚 **Inventory Control (CRUD)**: Create, read, update, and delete catalog records. Track real-time states (`available`, `borrowed`, `reserved`) and view historical logs per book.
- 👥 **Membership Registry (CRUD)**: Manage active and suspended user accounts. Enforce membership constraints, auto-generate membership Card IDs, and provide virtual library card views.
- 🔄 **Circulation Tracker (Borrow & Return)**: Automate loan lifecycles with standard 14-day checkout thresholds, overdue tracking, and automatically computed fine matrices.
- ⏳ **Holds & Reservations Queue**: Let members place holds on borrowed books. Book states dynamically transition to `reserved` upon return, locking checkout capability to the reserving member.
- 🔐 **Enhanced Security**: JWT authentication stored securely in client-hidden, HTTP-only cookies, `bcryptjs` password hashing, input sanitization, and Express header reinforcement using **Helmet**.

---

## Tech Stack

- **Frontend**: React (v19), Vite, Tailwind CSS, Lucide React (icons), Recharts (data visualizations), Axios (HTTP Client).
- **Backend**: Node.js, Express.js (MVC Pattern), Mongoose (MongoDB ODM), Joi (request validation), Morgan (request logger), Helmet (security headers).
- **Database**: MongoDB (Local or Atlas cloud cluster).
- **Security**: JWT (sessions), BcryptJS (password encryption), Cookie-Parser (cookie handling).

---

## Folder Structure

```
├── backend/                       # Node.js + Express MVC Backend
│   ├── config/                    # Database connection setup
│   ├── controllers/               # Controller modules containing request handler logic
│   ├── middleware/                # Logger, Error handling, and Auth protection middlewares
│   ├── models/                    # MongoDB schemas and models (Mongoose)
│   ├── routes/                    # Route endpoints declarations
│   ├── utils/                     # Custom validators (Joi) and AppError helpers
│   ├── .env.example               # Backend environment variables template
│   ├── seed.js                    # Database seeder scripts
│   └── server.js                  # Entry server hooks
│
├── src/                           # React + Vite Frontend
│   ├── api/                       # API integration modules
│   ├── assets/                    # Static image/vector assets
│   ├── components/                # Glassmorphic user interface modules
│   ├── utils/                     # Frontend mock DB and utility helpers
│   ├── App.css                    # Main layout stylesheet
│   ├── App.jsx                    # Application layout and authentication routing
│   ├── index.css                  # Tailored design style variables
│   └── main.jsx                   # Vite bootstrap hook
│
├── .env.example                   # Client environment variables template
├── vercel.json                    # Routing configurations for Vercel deployment
└── .gitignore                     # Centralized Git ignored definitions
```

---

## Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed and running locally, or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI.

### 1. Database & Server Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Initialize your `.env` configuration file by cloning the template:
   ```bash
   cp .env.example .env
   ```
4. Configure your parameters in `.env` (refer to the **Environment Variables** section below).
5. Seed the default database records (creates books, members, logs, and the default admin user):
   ```bash
   npm run seed
   ```
   *Seeded Admin Credentials:*
   - **Email**: `admin@lumina.com`
   - **Password**: `password123`
   - **Role**: `admin`
6. Fire up the development backend server:
   ```bash
   npm run dev
   ```
   The backend API will start listening on `http://localhost:5000`.

### 2. Frontend Setup
1. Open a new terminal session in the root workspace and install client-side dependencies:
   ```bash
   npm install
   ```
2. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
3. Boot the Vite development dev-server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.

---

## Environment Variables

### Backend Configuration (`backend/.env`)
Ensure your `backend/.env` file contains the following configurations:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/library_system
JWT_SECRET=your_super_secure_jwt_key_here
CLIENT_URL=http://localhost:5173
```

### Client Configuration (`.env` at root)
Configure your client API base URL pointing to the running backend server:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## API Endpoints

### Authentication
| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new system user / admin | Public |
| `POST` | `/api/auth/login` | Authenticate user, receive JWT cookie | Public |
| `POST` | `/api/auth/logout` | Invalidate cookie, log user out | Public |

### Books Catalog
| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/api/books` | Fetch all books matching parameters | Protected |
| `POST` | `/api/books` | Create a new catalog book entry | Protected |
| `GET` | `/api/books/:id` | Fetch specific book details | Protected |
| `PUT` | `/api/books/:id` | Modify book specifications | Protected |
| `DELETE` | `/api/books/:id` | Remove a book (blocked if checked out) | Protected |

### Members
| Method | Route | Description | Access |
|---|---|---|---|
| `GET` | `/api/members` | Retrieve all registered members | Protected |
| `POST` | `/api/members` | Register a new library member card | Protected |
| `GET` | `/api/members/:id` | Fetch detailed member profile | Protected |
| `PUT` | `/api/members/:id` | Modify member status or data | Protected |
| `DELETE` | `/api/members/:id` | Remove member (blocked if holding fines) | Protected |

### Transactions (Circulation)
| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/api/transactions/borrow` | Record check-out of a book to a member | Protected |
| `POST` | `/api/transactions/return` | Check in returned book, compute fines | Protected |
| `GET` | `/api/transactions/history` | Retrieve full circulation audits | Protected |

### Reservations (Holds)
| Method | Route | Description | Access |
|---|---|---|---|
| `POST` | `/api/reservations/reserve` | Place hold on a currently checked-out book | Protected |
| `POST` | `/api/reservations/cancel` | Cancel an active reservation hold | Protected |
| `GET` | `/api/reservations` | List all active or completed reservations | Protected |

---

## Authentication

LuminaLib secures admin dashboards using robust session verification practices:
- **JWT Signatures**: Logged-in users receive a signed JSON Web Token holding credentials and role access settings.
- **HTTP-Only Cookies**: JWT is stored in an `httpOnly` secure cookie wrapper (`req.cookies.jwt`). This blocks client-side Javascript scripts from reading token data, protecting the app against **XSS (Cross-Site Scripting)** vectors.
- **Route Guards**: Backend endpoints check for valid headers or cookies using a `protect` middleware layer before yielding resource data.

---

## Production Deployment Guide

Follow these steps to deploy LuminaLib in a live production environment.

### 1. Database Setup (MongoDB Atlas)
1. Sign up for a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
2. Build a new Shared Cluster (M0 tier is free).
3. In **Network Access**, add IP address `0.0.0.0/0` to allow connections from Render hosting servers.
4. Under **Database Access**, create a user account with read/write privileges.
5. In your cluster dashboard, click **Connect** -> **Drivers**, and copy the connection string. Replace `<password>` with your database user password.

### 2. Backend Deployment (Render)
1. Create an account on [Render](https://render.com/).
2. Click **New** -> **Web Service** and connect your GitHub repository.
3. Configure the following service settings:
   - **Root Directory**: `backend`
   - **Environment/Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables** in Render's configuration tab:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *[Your MongoDB Atlas Connection String]*
   - `JWT_SECRET`: *[A long, random, secure string]*
   - `CLIENT_URL`: *[Your production Vercel frontend URL, e.g. https://your-app.vercel.app]*
5. Click **Create Web Service**.

### 3. Frontend Deployment (Vercel)
1. Create a [Vercel](https://vercel.com/) account.
2. Click **Add New** -> **Project** and select your GitHub repository.
3. Configure the build parameters:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (Root project directory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand the **Environment Variables** panel and add:
   - `VITE_API_URL`: *[Your deployed Render API URL ending with `/api`, e.g. https://your-backend.onrender.com/api]*
5. Click **Deploy**.

---

## Project Screenshots

### 📊 Admin Analytics Dashboard
![Dashboard Mockup](https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200&h=600)
*Modern, responsive dashboard showing live counts, weekly borrow rates, and book category distributions.*

### 📚 Catalog & Circulation Registry
![Inventory UI Mockup](https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=1200&h=600)
*Streamlined book and member management menus featuring responsive search tables, popover cards, and reservation queues.*

---

## Future Improvements

- [ ] **Email Notifications**: Automatically dispatch warning emails to members when a checkout reaches its due-date threshold.
- [ ] **Multi-Librarian Permission Levels**: Create granular user roles (Super Admin, Librarian, Student Member) with distinct endpoint authorization blocks.
- [ ] **Advanced Cataloging (OpenLibrary API Integration)**: Support scanning a book's barcode or typing its ISBN to auto-populate metadata.
- [ ] **Self-Service Checkouts**: Allow members to scan virtual card QR codes to checkout books independently.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

---

## Author

**Saurabh**
- **GitHub**: [github.com/saurabh-personal](https://github.com/)
- **Email**: `contact@lumina.com`
- **LinkedIn**: [LinkedIn Profile](https://linkedin.com/)
