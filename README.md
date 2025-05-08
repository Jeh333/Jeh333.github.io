# MUCourseVisualizer

Mizzou Project Planner Capstone - Team 9 (Web Wizards)

## Overview

MUCourseVisualizer is a full-stack web application for visualizing and analyzing student course histories at the University of Missouri. It features interactive visualizations, statistics, and user management, built with a React frontend and a Node.js/Express/MongoDB backend.

---

## Project Structure

```
.
├── backend/         # Express/MongoDB API server
├── client/          # React frontend
├── .gitignore
├── README.md
└── ...
```

---

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- MongoDB Atlas or local MongoDB instance
- Firebase project for authentication

---

## Environment Variables

### Backend (`backend/.env`)

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_SERVICE_KEY=your_firebase_service_account_json_string
PORT=5000
```

- If running locally, you may use `backend/serviceAccountKey.json` instead of `FIREBASE_SERVICE_KEY`.

### Frontend (`client/.env`)

```
REACT_APP_API_URL=https://your-production-backend-url
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

---

## Setup & Installation

### 1. Clone the Repository

```sh
git clone https://github.com/Jeh333/Jeh333.github.io.git
cd Jeh333.github.io
```

### 2. Install Dependencies

#### Backend

```sh
cd backend
npm install
```

#### Frontend

```sh
cd ../client
npm install
```

### 3. Configure Environment Variables

- Need to create `.env` for both `backend/` and `client/` to function locally

### 4. Start the Application

- From the root folder, start both backend and frontend together:

```sh
npm start
```

- This uses `start-all.js` to launch both servers in parallel.

#### Alternatively, start each separately:

##### Backend

```sh
cd backend
npm start
```

##### Frontend

```sh
cd ../client
npm start
```

- The frontend will run on [http://localhost:3000](http://localhost:3000)
- The backend will run on [http://localhost:5000](http://localhost:5000)

---

## Features

- **User Authentication:** Firebase-based login/signup.
- **Course History Upload:** Upload and parse PDF transcripts.
- **Major Selection:** Set and update your major.
- **Visualization:** Interactive D3-based course/semester graphs.
- **Statistics:** View course and grade distributions by major.
- **Filtering:** Filter by major or semester
- **Responsive UI:** Works on desktop and mobile.

---

## API Endpoints (Backend)

- `POST /signup` - Register a new user (Firebase token required)
- `POST /users/login` - Login (Firebase token required)
- `GET /courses/:programId` - Get course details
- `GET /course-histories` - Get all users' course histories
- `POST /upload` - Upload and parse a transcript PDF (Firebase token required)
- `POST /submit-course-history` - Manually submit course history (Firebase token required)
- `POST /set-major` - Set or update user major (Firebase token required)
- `GET /get-major` - Get current user's major (Firebase token required)
- `GET /statistics/:major?type=distribution|grades` - Get statistics for a major

---