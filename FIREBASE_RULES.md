# Firebase Firestore Security Rules

The current authentication errors suggest that the Firestore security rules are preventing access to the database. 

## Current Error:
`FirebaseError: Missing or insufficient permissions`

## Recommended Firestore Rules:

For development/testing (more permissive):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write their own invoices
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow authenticated users to read/write their own buyers
    match /buyers/{buyerId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow authenticated users to read/write their own products/stock
    match /products/{productId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

For production (more secure):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Function to check if user owns the resource
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Function to validate user data
    function isValidUserData() {
      return request.resource.data.keys().hasAll(['email']) &&
             request.resource.data.email == request.auth.token.email;
    }
    
    match /users/{userId} {
      allow read, write: if isOwner(userId) && isValidUserData();
    }
    
    match /invoices/{invoiceId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
    }
    
    match /buyers/{buyerId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
    }
    
    match /products/{productId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
    }
  }
}
```

## Next Steps:
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Go to Rules tab
4. Apply the appropriate rules above
5. Test the application again

## Temporary Fix for Testing:
If you want to test immediately, you can temporarily use these very permissive rules (NOT for production):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```