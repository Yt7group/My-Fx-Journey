# Firebase setup (accounts + sync)

1. console.firebase.google.com -> Add project.
2. Build -> Authentication -> Get started -> enable **Email/Password** (the app turns a username into username@tjournal.app; no email is ever sent).
3. Build -> Firestore Database -> Create database (production mode), then paste these rules under Rules and Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      // admin can read the user list (username, createdAt, lastSeen) but not journal data:
      allow read: if request.auth != null && request.auth.uid == "YOUR_ADMIN_UID";
    }
    match /users/{uid}/data/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

4. Project settings -> Your apps -> Web (</>) -> copy the config values into `config.js`.
5. Upload all files to GitHub (same URL as before), bump the cache version in sw.js.

Notes: passwords cannot be recovered (no email). Screenshots stay on the phone; trades, deposits, settings and accounts sync.
