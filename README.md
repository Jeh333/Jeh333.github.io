# MUCourseVisualizer

Mizzou Project Planner Capstone - Team 9 (Web Wizards)

## Overview

MUCourseVisualizer is a full-stack web application for visualizing and analyzing student course histories at the University of Missouri. It features interactive visualizations, statistics, and user management, built with a React frontend and a Node.js/Express/MongoDB backend.

## Project Structure

─backend/         # Express/MongoDB API server
─client/          # React frontend
─.gitignore
─README.md

## Features

- **User Authentication:** Firebase-based login/signup.
- **Course History Upload:** Upload and parse PDF transcripts.
- **Major Selection:** Set and update your major.
- **Visualization:** Interactive D3-based course/semester graphs.
- **Statistics:** View course and grade distributions by major.
- **Filtering:** Filter by major or semester.
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