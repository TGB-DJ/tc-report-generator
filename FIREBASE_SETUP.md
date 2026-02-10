# Firebase Setup for Kanchi Shri Krishna College PWA

**Project Created:** `ksk-college-cj`
**Deployment Config:** Ready

## CRITICAL MANUAL STEPS REQUIRED

Since I cannot enable sensitive services via command line, you must do this in the Firebase Console:

1.  **Open Project**: [Go to Firebase Console - ksk-college-cj](https://console.firebase.google.com/project/ksk-college-cj/overview)

2.  **Enable Authentication**:
    - Go to **Build > Authentication**.
    - Click **"Get Started"**.
    - Click **"Email/Password"** -> **Enable** -> **Save**.
    - **Add Admin User**:
        - Go to **Users** tab.
        - Click **"Add user"**.
        - Email: `admin@ksk.edu.in`
        - Password: `password123`

3.  **Enable Firestore Database**:
    - Go to **Build > Firestore Database**.
    - Click **"Create Database"**.
    - Choose location (e.g., `asia-south1` or `us-central1`).
    - Select **"Start in Test Mode"**.
    - Click **"Create"**.
    - **Create Admin Profile**:
        - Click **"Start collection"**.
        - Collection ID: `users`
        - Document ID: *Paste the User UID from Authentication tab*
        - Field: `role`, Value: `admin`
        - Field: `email`, Value: `admin@ksk.edu.in`

4.  **Run the App**:
    - In VS Code terminal: `npm run dev`
    - Login with the admin credentials above.
