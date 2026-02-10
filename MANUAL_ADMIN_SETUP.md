# Manual Admin Profile Creation

Since the automated script is blocked by security rules, let's create the admin profile manually through the Firebase Console.

## Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project: **ksk-college-cj**
3. Click **Firestore Database** in the left sidebar

## Step 2: Get Your User UID
First, we need to find your user ID from Firebase Authentication:
1. Click **Authentication** in the left sidebar
2. Click the **Users** tab
3. Find the user `admin@ksk.edu.in`
4. **Copy the UID** (it looks like: `xYz123AbC...`)

## Step 3: Create 'users' Collection Document
1. Go back to **Firestore Database**
2. Click **"Start collection"** (or if collections exist, click **"+ Start collection"**)
3. Collection ID: `users`
4. Click **Next**
5. Document ID: **Paste the UID you copied**
6. Add these fields (click "+ Add field" for each):

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | (paste the same UID) |
| `email` | string | `admin@ksk.edu.in` |
| `role` | string | `admin` |
| `phone` | string | `9999999999` |
| `createdAt` | string | `2026-02-10T07:30:00.000Z` |

7. Click **Save**

## Step 4: Create 'admins' Collection Document
1. Click **"+ Start collection"** again
2. Collection ID: `admins`
3. Click **Next**
4. Document ID: **Paste the same UID again**
5. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | (paste the same UID) |
| `email` | string | `admin@ksk.edu.in` |
| `name` | string | `Super Admin` |
| `phone` | string | `9999999999` |
| `createdAt` | string | `2026-02-10T07:30:00.000Z` |

6. Click **Save**

## Step 5: Test Login
1. Go back to your app in the browser
2. Press **Ctrl + Shift + R** (hard refresh)
3. Login with:
   - Email: `admin@ksk.edu.in`
   - Password: `admin123`
4. You should now be redirected to the Admin Dashboard! 🎉

## Alternative: Use Firebase Console Import
If you prefer, you can also:
1. Update Firestore Rules temporarily to allow writes
2. Run the `create_admin.js` script again
3. Restore the security rules

Let me know if you need help with any of these steps!
