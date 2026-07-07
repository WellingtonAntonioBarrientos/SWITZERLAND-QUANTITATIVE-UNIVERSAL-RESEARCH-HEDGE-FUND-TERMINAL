# Test Credentials

## Authentication: REMOVED (Open Access)
As of Dec 2025, the app has NO login. Email/password authentication was removed at user request.
- The app opens directly to the dashboard at `/` (redirects to `/dashboard`).
- All backend API endpoints work WITHOUT any Authorization header/token.
- Old endpoints `/api/auth/login`, `/api/auth/verify`, `/api/auth/change-password` were deleted (return 404).

## Internal data key (do not change)
Paper trading portfolio data in MongoDB (`db.paper_accounts`) is keyed by
`user_id = "barrientoswellingtonantonio@gmail.com"`. This is an internal constant
(`OWNER_EMAIL` in `/app/backend/server.py`) — NOT a login credential. Preserve it to keep
the existing 150-order portfolio intact.
