# Eventogram 📸

> A centralized **Event & Media Management Platform** where clubs, photographers, and members can upload, organize, access, and interact with media content — powered by AI-based image tagging and facial recognition.

[![Tech Stack](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react)](https://reactjs.org/)
[![Tech Stack](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js)](https://nodejs.org/)
[![Tech Stack](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Tech Stack](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tech Stack](https://img.shields.io/badge/Storage-AWS%20S3-FF9900?logo=amazonaws)](https://aws.amazon.com/s3/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Evaluation Criteria Coverage](#evaluation-criteria-coverage)

---

## Overview

Clubs and societies generate hundreds of photos and videos during events — but this media usually ends up scattered across Google Drives, personal folders, and random cloud links. **Eventogram** solves this by providing a single platform where:

- Photographers can upload and organize media by event
- Members can discover, interact with, and download photos
- AI automatically tags images and helps users find photos of themselves

---

## Features

### Core Features

| Feature | Description |
|---|---|
| 🗂️ Event Management | Create events with title, date, category, and public/private visibility |
| 📤 Media Upload | Bulk upload, drag-and-drop, preview before upload, photo & video support |
| 🔒 Access Control | Role-based access: Admin, Photographer, Club Member, Viewer |
| ❤️ Social Features | Like, comment, share, download, favourite, tag friends |
| 🔔 Real-time Notifications | Notified when someone likes, comments, or tags you |
| 🤖 AI Image Tagging | Auto-generates tags like "mountains", "crowd", "sports" using AI |
| 🔍 Advanced Search | Search by event name, tags, date, username |
| 🧑 Facial Recognition | Upload a selfie → find all photos containing your face |
| ☁️ Cloud Storage | All media stored on AWS S3 for scalability |
| 💧 Watermarking | Auto-watermark on download based on club/event name and user role |


---

## Tech Stack

### Frontend
- **React.js** — UI library for building the interface
- **React Router** — for navigating between pages without full reloads
- **Axios** — for making HTTP requests to the backend

### Backend
- **Node.js** — JavaScript runtime for the server
- **Express.js** — lightweight web framework for building APIs
- **Prisma ORM** — type-safe way to talk to the database (instead of writing raw SQL)
- **JWT (JSON Web Tokens)** — for secure authentication
- **Multer** — for handling file uploads
- **face-api.js / @vladmandic/face-api** — for facial recognition

### Database & Storage
- **PostgreSQL** — relational database to store all structured data (users, events, media metadata)
- **AWS S3** — cloud object storage for the actual image/video files

### DevOps
- **Render** — backend hosting
- **Vercel** — frontend hosting
- **Neon** — hosted PostgreSQL database

---

## System Architecture

```mermaid
flowchart LR
    subgraph Client Side
        UI[React.js Frontend]
    end

    subgraph Server Side
        API[Node.js & Express Backend]
        ORM[Prisma ORM]
    end

    subgraph Data & Storage
        DB[(PostgreSQL Database)]
        S3[(Cloud Storage / S3)]
    end

    UI <-->|HTTP Requests| API
    API <-->|Prisma Queries| ORM
    ORM <-->|Read / Write| DB
    API <-->|Upload / Fetch Media| S3
```

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                              │
│                    React.js Frontend                            │
│            (Vercel — https://eventogram.vercel.app)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP Requests (REST API)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                              │
│              Node.js + Express.js Backend                       │
│                  (Railway / Render)                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth Routes  │  │ Media Routes │  │  AI / Face Routes    │  │
│  │ /api/auth    │  │ /api/media   │  │  /api/face           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                         │                                       │
│                    Prisma ORM                                   │
└──────────────┬──────────┴───────────────┬───────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────────────────┐
│  PostgreSQL Database │    │           AWS S3 Bucket             │
│  (Neon / Supabase)   │    │   (stores actual image/video files) │
│  stores metadata,    │    │   Media URL is saved in DB          │
│  users, events, etc. │    │                                     │
└──────────────────────┘    └─────────────────────────────────────┘
```

**How it works in simple terms:**
1. User opens the website (React frontend served from Vercel)
2. React sends requests to the Express backend
3. Backend uses Prisma to query/update the PostgreSQL database
4. When uploading media, the file goes directly to AWS S3 — only the URL is stored in the database
5. For facial recognition, face descriptors (128 numbers per face) are stored in the database and compared at query time

---

##  Database Schema

```mermaid
erDiagram
    USER ||--o{ EVENT : "creates"
    USER ||--o{ MEDIA : "uploads"
    USER ||--o{ LIKE : "gives"
    USER ||--o{ COMMENT : "writes"
    USER ||--o{ FAVOURITE : "adds"
    USER ||--o{ NOTIFICATION : "receives/triggers"
    USER ||--|| FACEDESCRIPTOR : "has"
    USER ||--o{ MEDIATAG : "tagged in"
    
    EVENT ||--o{ MEDIA : "contains"
    
    MEDIA ||--o{ LIKE : "receives"
    MEDIA ||--o{ COMMENT : "receives"
    MEDIA ||--o{ FAVOURITE : "receives"
    MEDIA ||--o{ MEDIATAG : "contains"
    MEDIA ||--o{ MEDIAFACEDATA : "contains faces"

    USER {
        Int id PK
        String name
        String email
        Role role
    }
    EVENT {
        Int id PK
        String title
        String category
        DateTime date
    }
    MEDIA {
        Int id PK
        String url
        MediaType type
        Int eventId FK
        Int uploaderId FK
    }
    LIKE {
        Int id PK
        Int userId FK
        Int mediaId FK
    }
    COMMENT {
        Int id PK
        String text
        Int userId FK
        Int mediaId FK
    }
    FACEDESCRIPTOR {
        Int id PK
        Float[] descriptor
        Int userId FK
    }
```

The database has **9 tables**. Here is a simplified overview:

```
User ──────┬──── creates ────► Event ───── contains ───► Media
           ├──── uploads ──────────────────────────────────┤
           ├──── gives ──────────────────────────────────► Like
           ├──── writes ─────────────────────────────────► Comment
           ├──── saves ──────────────────────────────────► Favourite
           ├──── tagged in ──────────────────────────────► MediaTag
           ├──── receives ──────────────────────────────► Notification
           └──── has ───────────────────────────────────► FaceDescriptor
```

### Key Tables

| Table | Purpose |
|---|---|
| `User` | Stores all users with their role (ADMIN / PHOTOGRAPHER / CLUB_MEMBER / VIEWER) |
| `Event` | An event (e.g. "Annual Fest 2025") that groups media together |
| `Media` | Each photo/video — stores S3 URL, AI tags, file metadata |
| `Like` | Records who liked which media (prevents double-likes) |
| `Comment` | User comments on media |
| `Favourite` | User bookmarks for media |
| `MediaTag` | Tagging another user in a photo |
| `Notification` | In-app alerts (like, comment, tag events) |
| `FaceDescriptor` | 128-number face fingerprint per user for facial recognition |

Full Prisma schema is in `backend/prisma/schema.prisma`.

---

## Getting Started

### Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/) (or use a hosted DB like [Neon](https://neon.tech) — free tier available)
- An [AWS account](https://aws.amazon.com/) with an S3 bucket (or use a free S3-compatible service)

### 1. Clone the repository

```bash
git clone https://github.com/bumble-bhee/eventogram.git
cd eventogram
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder (see [Environment Variables](#environment-variables) below).

Run database migrations (this creates all tables in your PostgreSQL database):

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend server:

```bash
npm run dev
```

Backend will run at `http://localhost:5000`

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file inside the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm start
```

Frontend will run at `http://localhost:3000`

---

## Environment Variables

### `backend/.env`

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/eventogram"

# JWT Secret (any long random string)
JWT_SECRET="your-super-secret-key-here"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="your-bucket-name"

# Server
PORT=5000
NODE_ENV=development
```

### `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000
```

> ⚠️ **Important:** Never commit `.env` files to GitHub. They are already in `.gitignore`.

---

## Project Structure

```
eventogram/
├── frontend/                  # React.js application
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page-level components (Home, Event, Profile)
│   │   ├── context/           # React Context for auth state
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API call functions (axios)
│   │   └── App.js
│   └── package.json
│
├── backend/                   # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma      # Database schema definition
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.js        # Login, register, JWT
│   │   │   ├── events.js      # CRUD for events
│   │   │   ├── media.js       # Upload, fetch, delete media
│   │   │   ├── social.js      # Like, comment, favourite
│   │   │   ├── notifications.js
│   │   │   └── face.js        # Facial recognition
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT verification middleware
│   │   │   └── upload.js      # Multer + S3 config
│   │   ├── services/
│   │   │   ├── s3.js          # AWS S3 upload/delete helpers
│   │   │   └── ai.js          # AI tagging logic
│   │   └── index.js           # Entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## API Overview

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/events` | Get all public events | No |
| POST | `/api/events` | Create a new event | Yes (Admin/Photographer) |
| GET | `/api/events/:id/media` | Get all media for an event | No |
| POST | `/api/media/upload` | Upload photo/video | Yes (Photographer) |
| POST | `/api/media/:id/like` | Like a media item | Yes |
| POST | `/api/media/:id/comment` | Comment on a media item | Yes |
| GET | `/api/notifications` | Get user notifications | Yes |
| POST | `/api/face/upload-selfie` | Upload reference selfie | Yes |
| GET | `/api/face/my-photos` | Get all photos containing your face | Yes |

---

## Deployment

### Deploy Backend to Render (Free)

1. Go to [render.com](https://render.com) → Create account
2. Click **New → Web Service**
3. Connect your GitHub repo → Select `eventogram`
4. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install && npx prisma generate`
   - **Start command:** `npm start`
5. Add all environment variables from `backend/.env` in the **Environment** tab
6. Click **Deploy**

### Deploy Frontend to Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → Create account
2. Click **Add New → Project**
3. Import your GitHub repo
4. Settings:
   - **Root directory:** `frontend`
   - **Framework preset:** Create React App
5. Add environment variable:
   - `REACT_APP_API_URL` = your Render backend URL (e.g. `https://eventogram-api.onrender.com`)
6. Click **Deploy**

### Database: Neon (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech) → Create account → New project
2. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/eventogram`)
3. Set this as `DATABASE_URL` in your Render environment variables
4. Run migrations: in Render's shell or locally with the Neon URL:
   ```bash
   npx prisma migrate deploy
   ```

---

## Evaluation Criteria Coverage

| Criteria | Weight | Implementation |
|---|---|---|
| UI/UX and Design | 15% | Responsive React UI with clean event galleries |
| Backend Architecture & APIs | 15% | RESTful Express APIs with Prisma ORM |
| Authentication & Access Control | 10% | JWT auth + 4-level role-based access |
| Cloud Integration | 15% | AWS S3 for all media storage |
| Media Management Features | 15% | Upload, bulk upload, drag-drop, preview, download |
| AI/ML Features | 15% | Auto image tagging + facial recognition with face-api.js |
| Real-time Notifications | 5% | In-app notifications for likes, comments, tags |
| Code Quality & Scalability | 5% | Prisma ORM, modular routes, env-based config |
| Innovation & Bonus Features | 5% | Infinite scroll, watermarking on download |

---

## Author

- Abhinav Jayale [@bumble-bhee](https://github.com/bumble-bhee)
  

---
