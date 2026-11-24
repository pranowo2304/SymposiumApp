/**
 * Phase 0 Payload-First Security Test Suite for firestore.rules
 * Verifies that all "Dirty Dozen" attack vectors are rejected with PERMISSION_DENIED
 * when executed against the Firebase Emulator Suite (`@firebase/rules-unit-testing`).
 */

export const DIRTY_DOZEN_SECURITY_CASES = [
  {
    id: 1,
    name: 'Unauthenticated write to sessions catalog',
    path: 'sessions/evil-session',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Non-admin mutation of event_info/main',
    path: 'event_info/main',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Self-assigned admin role in users/{uid} create',
    path: 'users/user-a',
    payload: { uid: 'user-a', email: 'a@example.com', role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow field injection (isAdmin) in users/{uid} update',
    path: 'users/user-a',
    payload: { isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unverified email posting chat message',
    path: 'sessions/ws-versus-01/chat_messages/msg-unverified',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-user PII read on users/{otherUid}',
    path: 'users/user-b',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Blanket list query on participants PII collection by non-admin',
    path: 'participants',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Orphaned chat message under non-existent sessionId',
    path: 'sessions/missing-session/chat_messages/msg-1',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Author UID spoofing in chat_messages create',
    path: 'sessions/ws-versus-01/chat_messages/msg-spoof',
    payload: { authorUid: 'victim-uid' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Backdated client timestamp bypassing request.time',
    path: 'users/user-a/bookmarks/ws-versus-01',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Oversized message (>2000 chars) or upvotedBy (>500 items)',
    path: 'sessions/ws-versus-01/chat_messages/msg-dos',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Malformed path variable failing isValidId regex',
    path: 'sessions/invalid.id$with!chars',
    expected: 'PERMISSION_DENIED',
  },
] as const;
