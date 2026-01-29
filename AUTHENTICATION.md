# Authentication Guide

## Overview

The PTO Tracker now includes JWT-based authentication to secure access to the application. Users must log in with valid credentials to access the vacation data.

## Features

- **JWT Token Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin and user roles with different permissions
- **Multi-Tenant Support**: Each user is associated with a specific tenant
- **Persistent Sessions**: Login sessions persist across browser refreshes
- **Secure Password Storage**: Passwords are hashed using bcrypt

## Default Users

The system comes with three pre-configured users:

| Username | Password   | Tenant  | Role  |
|----------|------------|---------|-------|
| admin    | admin123   | acme    | admin |
| demo     | demo123    | demo    | user  |
| test     | test123    | testco  | user  |

## API Endpoints

### Public Endpoints

#### POST /auth/login
Authenticate a user and receive a JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "1",
    "username": "admin",
    "tenantId": "acme",
    "role": "admin"
  }
}
```

### Protected Endpoints

All other API endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

#### GET /auth/me
Get current user information.

**Response:**
```json
{
  "user": {
    "id": "1",
    "username": "admin",
    "tenantId": "acme",
    "role": "admin"
  }
}
```

#### GET /auth/users
Get all users (admin only).

**Response:**
```json
[
  {
    "id": "1",
    "username": "admin",
    "tenantId": "acme",
    "role": "admin"
  },
  ...
]
```

#### GET /employees
Get employees for the authenticated user's tenant.

#### GET /divisions
Get divisions for the authenticated user's tenant.

#### GET /events
Get time-off events for the authenticated user's tenant.

## Frontend Integration

The frontend automatically:
- Shows a login page when not authenticated
- Stores the JWT token in localStorage
- Includes the token in all API requests
- Redirects to login on authentication errors
- Provides a logout button to clear the session

## Security Considerations

### For Development

The current implementation uses:
- In-memory user storage
- A default JWT secret (not secure for production)
- Pre-configured demo users

### For Production

Before deploying to production, you should:

1. **Use a Database**: Replace the in-memory user store with a proper database (PostgreSQL, MySQL, MongoDB, etc.)

2. **Secure JWT Secret**: Set a strong JWT secret in environment variables:
   ```bash
   JWT_SECRET=your-very-long-random-secret-key
   JWT_EXPIRES_IN=24h
   ```

3. **HTTPS Only**: Ensure the application runs over HTTPS to prevent token interception

4. **Remove Demo Users**: Delete or change passwords for default users

5. **Add User Management**: Implement user registration, password reset, and profile management

6. **Rate Limiting**: Add rate limiting to prevent brute-force attacks

7. **Token Refresh**: Implement token refresh mechanism for long-lived sessions

8. **Password Policy**: Enforce strong password requirements

## Adding New Users

Currently, users can be added programmatically using the `addUser` function in `src/auth.ts`:

```typescript
import { addUser } from './auth';

addUser('newuser', 'password123', 'acme', 'user');
```

For production, you should implement proper user registration endpoints with:
- Email verification
- Password strength validation
- CAPTCHA protection
- Admin approval workflow (if needed)

## Customizing Authentication

### Change Token Expiration

Edit the `JWT_EXPIRES_IN` value in `src/auth.ts` or set it as an environment variable:
```typescript
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days
```

### Add Custom Claims to JWT

Modify the `generateToken` function in `src/auth.ts`:
```typescript
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      tenantId: user.tenantId,
      role: user.role,
      // Add custom claims here
      customClaim: 'value',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}
```

### Implement Role-Based Permissions

The authentication middleware adds the user object to the request. Use it to implement custom authorization:

```typescript
app.get("/admin-only", authMiddleware, (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  // Admin-only logic here
});
```

## Troubleshooting

### "Invalid or expired token" Error

- Token may have expired (default: 24 hours)
- JWT secret may have changed
- Token format is incorrect
- Solution: Log out and log in again

### "No token provided" Error

- Authorization header is missing
- Token is not prefixed with "Bearer "
- Solution: Check that frontend is sending the token correctly

### Can't Log In

- Check username and password are correct
- Verify backend server is running
- Check browser console for API errors
- Verify CORS is configured correctly

## Next Steps

To extend the authentication system:

1. **OAuth/SSO Integration**: Add support for Google, Microsoft, or SAML authentication
2. **2FA**: Implement two-factor authentication for additional security
3. **Session Management**: Add ability to view and revoke active sessions
4. **Audit Logging**: Track login attempts and user actions
5. **Password Policies**: Implement password expiration and complexity requirements
