# Security Specifications for LetterPoster Firestore

## 1. Data Invariants
- A letter must belong to a verified creator (`userId == request.auth.uid`).
- A letter can be read individually (`get`) by anyone holding the letter ID (enabling link sharing).
- A list query of letters (`list`) must only return letters belonging to the currently authenticated, verified user.
- The letter's `createdAt` timestamp must be set to the server-assigned transaction time.
- All text fields (`title`, `recipient`, `sender`, `body`, `theme`) have strict maximum bounds on size to prevent resource exhaustion.

## 2. The "Dirty Dozen" Payloads (Denial Scenarios)
1. **Unauthenticated Write**: Creating a letter with `request.auth = null`.
2. **Identity Spoofing (Create)**: Setting `userId` to `victim_uid` instead of `request.auth.uid`.
3. **Identity Spoofing (Update)**: Attempting to update a letter where `existing().userId != request.auth.uid`.
4. **Client-Manipulated Timestamp**: Setting `createdAt` to a client-controlled date instead of `request.time`.
5. **Vast Payload Attack**: Creating a letter with a `body` size exceeding 10,000 characters.
6. **Title Payload Overfill**: Creating a letter with a `title` size exceeding 200 characters.
7. **Phantom Field Injection**: Creating a letter with a shadow field (e.g., `isAdmin: true` or `verified: true`) to bypass schema boundaries.
8. **Invalid Theme Code**: Creating a letter with an unsupported theme name.
9. **Unverified Email Auth**: Writing a letter with a user account where `request.auth.token.email_verified == false`.
10. **Global Search Scraping**: Performing a collection group or list query without filtering for `userId == request.auth.uid`.
11. **Malicious Letter Deletion**: Attempting to delete a letter that is owned by another user.
12. **Malformed Schema Properties**: Creating a letter document with missing fields (e.g. missing `body` or `recipient`).

## 3. Test Verification
These scenarios are fully blocked by the declarative ruleset enforced in `firestore.rules`.
