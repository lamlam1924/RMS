# Resume Builder - Fullstack System

Professional Resume Builder with Node.js backend and React frontend.

## Tech Stack

- **Frontend**: React (Vite) + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MySQL

## Setup

### 1. Database

```sql
CREATE DATABASE IF NOT EXISTS resume_builder;
USE resume_builder;

CREATE TABLE IF NOT EXISTS resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidateId INT NOT NULL,
  data JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Or run `resume-builder/server/src/db/init.sql`

### 2. Backend (Node.js)

```bash
cd resume-builder/server
npm install
```

Create `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=resume_builder
PORT=4000
```

Start:
```bash
npm run dev
```

### 3. Frontend

The Resume Builder is integrated into the main RMS frontend. Add to `.env`:

```
VITE_RESUME_API_URL=http://localhost:4000/api
```

Then from `frontend/`:
```bash
npm install
npm run dev
```

### 4. Access

Open `http://localhost:5173/resume-builder`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST   | /api/resume        | Create resume |
| GET    | /api/resume/:id    | Get resume |
| PUT    | /api/resume/:id    | Update resume |
| DELETE | /api/resume/:id    | Delete resume |

## Features

- Two-column layout (30% sidebar / 70% main)
- Inline editing with Edit/View mode toggle
- Add/delete skills, jobs, education, references
- Skill level slider
- Add/delete description bullets per job
- Auto-save to localStorage
- Save to API (POST when new, PUT when exists)
- Download PDF (html2canvas + jsPDF)
- A4 printable
