# Auth Testing (Rasio Elektrifikasi Murung Raya)

Login is USERNAME + password (not email).

## Admin
- Username: `admin`
- Password: `adminRE1234#`
- Role: Super Admin

## Endpoints
- POST /api/auth/login  {username, password} -> {user, access_token}
- GET  /api/auth/me     (Bearer token or cookie)
- POST /api/auth/logout
- Users: GET/POST /api/users, PATCH/DELETE /api/users/{id}

## Notes
- Frontend stores JWT in localStorage key `re_token` and sends `Authorization: Bearer`.
- No email/password-reset flow (internal admin panel, username-only login).

## Quick check
curl -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"adminRE1234#"}'
