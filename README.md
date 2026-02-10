# College TC Generator PWA

A Progressive Web App for managing college students, teachers, and generating Transfer Certificates.

## Features
- **Admin Dashboard**: Manage Students, Teachers, and view Fee stats.
- **Teacher Dashboard**: View students in your department.
- **Student Dashboard**: View fees status and generate TC.
- **TC Generation**: Automatic eligibility check (Zero Balance) and printable certificate.
- **PWA**: Installable on mobile/desktop, offline support.

## Setup Instructions

1.  **Firebase Setup**
    - Go to [Firebase Console](https://console.firebase.google.com/).
    - Create a new project.
    - Enable **Authentication** (Email/Password).
    - Enable **Firestore Database** (Start in Test Mode).
    - Get your web app configuration keys.

2.  **Environment Variables**
    - Rename `.env` to `.env.local` (optional, or just update `.env`).
    - Fill in your Firebase keys in `.env`:
      ```env
      VITE_FIREBASE_API_KEY=...
      VITE_FIREBASE_AUTH_DOMAIN=...
      VITE_FIREBASE_PROJECT_ID=...
      ...
      ```

3.  **Install Dependencies**
    ```bash
    npm install
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

5.  **Build**
    ```bash
    npm run build
    ```

## Default Login
Since this is a fresh system, you need to create the first Admin user.
You can use the SignUp method if implemented, or manually create a user in Firebase Console Authentication, then create a corresponding document in `users` collection in Firestore:
- **Collection**: `users`
- **Document ID**: `User UID`
- **Fields**:
  - `email`: `admin@college.com`
  - `role`: `admin`

Once logged in as Admin, you can add Teachers and Students via the UI.
