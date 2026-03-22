# Self-Service Account Creation — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Allow users to create their own accounts from the login flow, using the same single input field.

## Context

The user accounts feature currently requires the admin to manually create accounts by editing `data/users/users.json` and creating user directories in the repo. This spec adds self-service account creation so users can create their own username from the login UI.

## Requirements

- Single input field handles both login and registration — no new inputs.
- Flow: user types a username and submits.
  - If the username exists → login (existing behavior).
  - If the username is new → show confirmation: "[username] is a new user. Create account?" with Create and Back buttons.
- No duplicate usernames. If a race condition causes a duplicate attempt, the server returns a 409 error displayed as "Username already exists."
- On successful account creation, the user is automatically logged in.
- Session persists between accesses at different times and devices (already handled by localStorage + server-side data).
- Submit button text changes from "Log in" to "Continue" to reflect the dual-purpose flow.

## API Changes

### New endpoint: POST /api/users

Creates a new user account.

**Request:**
```json
{ "username": "alice" }
```

**Response codes:**
- **201:** User created. Returns `{ id, username, role, createdAt }`.
- **400:** Invalid username format (not matching `/^[a-zA-Z0-9_-]+$/`).
- **409:** Username already exists.

**Server behavior:**
1. Validate username format.
2. Read `data/users/users.json` from GitHub.
3. Check for duplicate `id` (lowercased username). If exists → 409.
4. Append new entry: `{ id: username.toLowerCase(), username, role: "user", createdAt: now }`.
5. Write updated `users.json` via auto-merge PR.
6. Create `data/users/{id}/characters.json` containing `[]` in the same PR branch (single PR for both files).
7. Return 201 with the new user entry.

### Modified: GET /api/users/:userId/characters

No changes to this endpoint. It still returns 404 for unknown users, which the frontend now interprets as "new user" rather than an error.

## Frontend Changes

### AuthContext

Add to the interface:
- `pendingNewUser: string | null` — set when login returns 404, cleared on cancel or successful creation.
- `createAccount: (username: string) => Promise<boolean>` — calls `POST /api/users`, then `login()` on success.
- `clearPendingNewUser: () => void` — resets the pending state.

Updated `login()` behavior:
- On 404: instead of setting `loginError`, set `pendingNewUser` to the username. Return false (not logged in yet).

`createAccount()` behavior:
1. Call `POST /api/users` with `{ username }`.
2. On 201: clear `pendingNewUser`, call `login(username)` to complete auth.
3. On 409: set `loginError` to "Username already exists." (race condition).
4. On other errors: set `loginError` appropriately.

### LoginScreen and LoginModal

Both components share the same flow logic. Updated behavior:

**Default state (input visible):**
- Input placeholder: "Username"
- Submit button text: "Continue" (not "Log in")
- On submit: calls `login(username)`
  - If login succeeds → `onSuccess` fires (existing)
  - If `pendingNewUser` gets set → switch to confirmation state

**Confirmation state (pendingNewUser is set):**
- Hide the input field
- Show text: "[username] is a new user. Create account?"
- Two buttons: "Create" and "Back"
- **Create:** calls `createAccount(pendingNewUser)` → on success, `onSuccess` fires
- **Back:** calls `clearPendingNewUser()`, returns to input state

**Error display:**
- `loginError` shown below the input (default state) or below the confirmation text (confirmation state)
- Errors clear on new submit or state change

### Subtitle text updates

- LoginScreen: "Enter or create your username." (was: "Enter your username to access your characters.")
- LoginModal: "Enter or create your username." (was: "Enter your username to create and manage characters.")

## Data Flow

```
User types "alice" → Submit
    ↓
GET /api/users/alice/characters
    ↓
┌─ 200: Login succeeds → done
└─ 404: Set pendingNewUser = "alice"
         ↓
    Show: "alice is a new user. Create account?"
         ↓
    ┌─ [Create]: POST /api/users { username: "alice" }
    │      ↓
    │  ┌─ 201: Created → login("alice") → done
    │  └─ 409: "Username already exists."
    └─ [Back]: Clear pendingNewUser → return to input
```

## Out of Scope

- Password protection.
- Email or additional profile fields.
- Account deletion from the UI.
- Username validation beyond format (profanity, length limits, etc.).
