# Luxor Connect - Firebase multi-user patch

## What this patch changes
- Replaces device-only `localStorage` social feed with Firestore cloud posts, comments, likes, and shared events.
- Uses Firebase anonymous sign-in (each device/user gets an auth UID).
- Uploaded post images go to Firebase Storage (max 5 MB).
- If Firebase config is still placeholder, app falls back to local mode; it will NOT sync between users.

## Files to copy to your GitHub repository
Copy/replace these paths in your repository:
- `app.js` (repository root)
- `index.html` (repository root)
- `www/app.js` (Capacitor webDir copy)
- `www/index.html`
- Add `firebase-config.js` at root AND `www/firebase-config.js`
- Add `firestore.rules` and `storage.rules` to repository root (then publish them in Firebase console)

Keep your existing `style.css` and `www/style.css` files.

## Firebase setup (required for shared users)
1. Open Firebase Console and create/select your project.
2. Add a **Web app** in Project settings > General > Your apps, then copy its config values.
3. Paste those values into `firebase-config.js` and `www/firebase-config.js`, replacing all `PASTE_...` placeholders.
4. Firebase Console > Authentication > Sign-in method: enable **Anonymous**.
5. Create Firestore Database.
6. Firestore > Rules: paste contents of `firestore.rules`, then Publish.
7. Storage > Get started > Rules: paste contents of `storage.rules`, then Publish.
8. Deploy/host the app or rebuild the APK. Users must open the same deployed app connected to the same Firebase project.


## Important security note
These sample rules are a prototype. Event creation/deletion is open to any signed-in app user. Before public launch, add moderator/admin permissions and stronger validation. Never place private server keys in client files. Firebase web config is public by design, but database/storage security rules must be enforced in Firebase.

## For Capacitor
The project uses `webDir: "www"`, so the `www` files are the ones packaged into APK. Ensure the config is copied there as well. After committing, your GitHub Action can build the APK as usual.
