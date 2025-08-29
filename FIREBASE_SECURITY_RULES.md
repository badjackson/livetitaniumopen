# Firebase Security Rules

To fix the permission errors, you need to update your Firebase Security Rules in the Firebase Console.

## How to Update Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `titanium-f7b50`
3. Navigate to **Firestore Database**
4. Click on the **Rules** tab
5. Replace the existing rules with the rules below
6. Click **Publish**

## Security Rules for Development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to hourly_entries collection
    match /hourly_entries/{document} {
      allow read, write: if true;
    }
    
    // Allow read/write access to big_catches collection
    match /big_catches/{document} {
      allow read, write: if true;
    }
    
    // Allow read/write access to competitors collection
    match /competitors/{document} {
      allow read, write: if true;
    }
    
    // Allow read/write access to judges collection
    match /judges/{document} {
      allow read, write: if true;
    }
    
    // Allow read/write access to users collection
    match /users/{document} {
      allow read, write: if true;
    }
    
    // Allow read/write access to competitionSettings collection
    match /competitionSettings/{document} {
      allow read, write: if true;
    }
  }
}
```

## Security Rules for Production (More Secure):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             resource.data.role == 'admin' || 
             request.auth.token.role == 'admin';
    }
    
    // Function to check if user is judge
    function isJudge() {
      return isAuthenticated() && 
             resource.data.role == 'judge' || 
             request.auth.token.role == 'judge';
    }
    
    // Hourly entries - allow judges and admins
    match /hourly_entries/{document} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || isJudge();
    }
    
    // Big catches - allow judges and admins
    match /big_catches/{document} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || isJudge();
    }
    
    // Competitors - allow read for all authenticated, write for admins
    match /competitors/{document} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Judges - admin only
    match /judges/{document} {
      allow read, write: if isAdmin();
    }
    
    // Users - admin only
    match /users/{document} {
      allow read, write: if isAdmin();
    }
    
    // Competition settings - admin only
    match /competitionSettings/{document} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

## Recommended Steps:

1. **Start with Development Rules** - Use the first set of rules to get everything working
2. **Test Your Application** - Make sure all features work correctly
3. **Implement Authentication** - Add Firebase Auth to your app
4. **Switch to Production Rules** - Use the more secure rules once authentication is implemented

## Current Error:
The error "Missing or insufficient permissions" occurs because the default Firestore rules deny all access. You must update the rules in the Firebase Console to allow your application to read and write data.