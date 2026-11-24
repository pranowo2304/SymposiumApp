# Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: No document in Firestore is readable or writable unless explicitly permitted by a collection rule.
2. **Admin Privilege Integrity**: Only the bootstrapped admin (`pranowo.tfc@gmail.com` with `email_verified == true`) or UIDs present in `/admins/{uid}` may mutate conference catalog collections (`event_info`, `sessions`, `speakers`, `exhibitors`, `rooms`, `broadcasts`) or manage `/admins/{uid}` and other users' `/participants/{id}` records.
3. **No Self-Assigned Admin Role**: During `/users/{userId}` creation, `role` must be `'attendee'` unless the caller is already an admin; users cannot escalate `role` to `'admin'` on update.
4. **PII Isolation**: Collections containing PII (`/users/{userId}`, `/users/{userId}/attendances/{id}`, `/participants/{id}`) are strictly restricted to the owning user or an admin. Blanket `isSignedIn()` list/get queries are forbidden.
5. **Master Gate & Anti-Orphan**: A chat message at `/sessions/{sessionId}/chat_messages/{messageId}` cannot be created unless `/sessions/{sessionId}` exists and `incoming().sessionId == sessionId` and `incoming().authorUid == request.auth.uid`.
6. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamp fields written from clients must equal `request.time`, and `createdAt` / `authorUid` / `userId` are immutable after creation.
7. **Anti-Shadow-Field & Size Bounds**: Every create enforces `keys().hasAll(...)` and `keys().hasOnly(...)`, every update checks `affectedKeys().hasOnly(...)` + `isValid[Entity](incoming())`, and every string/array enforces explicit `.size()` bounds.

## 2. The "Dirty Dozen" Attack Payloads (Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Write to Sessions**: Unauthenticated user tries to create `/sessions/evil-1`.
2. **Non-Admin Catalog Mutation**: Verified attendee (`other@example.com`) tries to update `/event_info/main` title.
3. **Privilege Escalation on User Profile**: Attendee creates `/users/{uid}` with `role: 'admin'`.
4. **Shadow Field Injection on User Profile**: Attendee updates `/users/{uid}` injecting `{ isAdmin: true }` or `{ verified: true }`.
5. **Unverified Email Write**: Signed-in user with `email_verified: false` tries to post a chat message.
6. **Cross-User PII Read (`users`)**: User A tries `get` or `list` on `/users/{userB}` or `/users` without owning it.
7. **Cross-User PII Scrape (`participants`)**: User A runs `getDocs(collection(db, 'participants'))` without matching `email == request.auth.token.email`.
8. **Orphaned Chat Message**: User tries to create `/sessions/non-existent-session/chat_messages/msg-1`.
9. **Author UID Spoofing**: User A creates chat message with `authorUid: 'user-b-uid'`.
10. **Client Timestamp Forgery**: User creates bookmark or chat message with backdated `createdAt` (`Timestamp.fromMillis(0)`) instead of `serverTimestamp()`.
11. **Oversized Array / String Denial-of-Wallet**: User posts chat message with `message` > 2000 chars or `upvotedBy` array > 500 items.
12. **Invalid Path Variable ID**: Attacker attempts write to `/sessions/bad$id..with.dots` failing `isValidId()`.
