# Firestore Database Setup Instructions

## Problem
Error: `Database '(default)' not found. Please check your project configuration.`

This means your Firebase project doesn't have a Firestore database created yet.

## Solution - Create Firestore Database

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your project: **ksk-college-cj**

### Step 2: Create Firestore Database
1. In the left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"** button
3. Choose a starting mode:
   - **Production mode** (Recommended for now - we'll set rules later)
   - Or **Test mode** (allows all reads/writes for 30 days)
4. Choose a location:
   - Select the closest region to you (e.g., `asia-south1` for India)
   - Click **"Enable"**

### Step 3: Wait for Database Creation
- It will take 1-2 minutes to provision the database
- You'll see a loading screen, then an empty database view

### Step 4: Set Security Rules (Important!)
Once the database is created, go to the **"Rules"** tab and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins collection - only admins can read/write
    match /admins/{adminId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Teachers collection - admins can write, teachers can read their own
    match /teachers/{teacherId} {
      allow read: if request.auth != null && 
        (request.auth.uid == teacherId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Students collection - admins can write, students can read their own
    match /students/{studentId} {
      allow read: if request.auth != null && 
        (request.auth.uid == studentId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Click **"Publish"** to save the rules.

### Step 5: Refresh Your Application
1. Go back to your browser with the app
2. Press **Ctrl + Shift + R** (hard refresh)
3. The infinite loading should stop
4. You should now be able to create students and teachers!

## What This Fixes
- ✅ Infinite "Loading Application..." loop
- ✅ Ability to create students and teachers
- ✅ Proper data storage and retrieval
- ✅ User authentication and profile management

## Next Steps After Setup
Once Firestore is created, you can:
1. Use the "Repair Database" button on the login page to create test accounts
2. Or manually create students/teachers through the Admin Dashboard
