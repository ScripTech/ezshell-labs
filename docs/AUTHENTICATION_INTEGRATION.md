# Authentication Integration Documentation

## Overview

This document describes the seamless authentication integration between the Next.js frontend (using NextAuth) and the Node.js backend for secure Socket.IO connections and API access.

## Architecture

### Frontend Authentication (NextAuth)
- **Providers**: Google OAuth and GitHub OAuth
- **Session Strategy**: JWT-based sessions
- **Token Endpoint**: `/api/auth/token` provides JWT tokens for backend communication

### Backend Authentication
- **JWT Verification**: Uses the same secret as NextAuth for token validation
- **Socket.IO Middleware**: Authenticates connections before allowing access
- **Express Middleware**: Protects HTTP API routes

## Components

### 1. JWT Service (`backend/src/utils/jwt.ts`)
Handles JWT token verification and user extraction:

```typescript
// Verify NextAuth JWT token
const user = JWTService.verifyToken(token);

// Extract token from Authorization header
const token = JWTService.extractTokenFromHeader(authHeader);
```

### 2. Socket Authentication Middleware (`backend/src/middleware/socketAuth.ts`)
Automatically authenticates Socket.IO connections:

```typescript
// Applied to all socket connections
httpSocketServer.use(socketAuthMiddleware);

// User info automatically attached to socket
socket.user // { sub: userId, email, name, role }
```

### 3. HTTP Authentication Middleware (`backend/src/middleware/auth.ts`)
Protects Express routes:

```typescript
// Require authentication
app.use('/api/protected', authMiddleware);

// Optional authentication
app.use('/api/public', optionalAuthMiddleware);

// Admin only
app.use('/api/admin', adminMiddleware);
```

### 4. Socket User Service (`backend/src/services/SocketUserService.ts`)
Helper service for extracting user context from authenticated sockets:

```typescript
// Get user info from socket
const userContext = SocketUserService.getUserContext(socket);

// Get user with lab enrollment
const context = await SocketUserService.getUserContextWithLab(socket, labId);
```

### 5. Authenticated Socket Service (`frontend/src/services/authenticatedSocket.ts`)
Frontend service for authenticated Socket.IO connections:

```typescript
// Connect with authentication
const socket = await authenticatedSocketService.connect();

// Validate task with auto-authentication
await authenticatedSocketService.validateTask(taskId, labId);
```

### 6. React Hooks (`frontend/src/hooks/useAuthenticatedSocket.ts`)
React hooks for easy socket integration:

```typescript
// Basic authenticated socket
const { socket, isConnected, isAuthenticated } = useAuthenticatedSocket();

// Task validation with authentication
const { validateTask, isReady } = useTaskValidation();
```

## Usage Examples

### Backend: Authenticated Validation Controller

```typescript
export class BasicValidationController {
  handleFilePermissionsValidationAuthenticated = async (
    socket: AuthenticatedSocket,
    questionId: string,
    labId: string
  ) => {
    // Extract user context automatically
    const userContext = await SocketUserService.getUserContextWithLab(socket, labId);

    if (!userContext?.labEnrollmentId) {
      socket.emit(`validation-${questionId}-error`, {
        error: 'Authentication or lab enrollment required'
      });
      return;
    }

    // Use ValidationTrackingService with full context
    const context: ValidationContext = {
      socket,
      questionId,
      userId: userContext.userId,
      labEnrollmentId: userContext.labEnrollmentId
    };

    await validationTrackingService.executeValidationWithTracking(context, steps);
  };
}
```

### Frontend: Component with Authentication

```typescript
export function TaskValidationComponent() {
  const { validateTask, isReady } = useTaskValidation();

  const handleValidate = async () => {
    if (!isReady) return;

    try {
      // User authentication handled automatically
      await validateTask('task-1', 'ex200');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Button onClick={handleValidate} disabled={!isReady}>
      Validate Task
    </Button>
  );
}
```

## Security Features

### 1. Automatic Authentication
- All Socket.IO connections require valid JWT tokens
- Expired or invalid tokens are rejected
- User context is automatically attached to socket instances

### 2. Session Management
- Frontend automatically refreshes tokens when needed
- Backend validates tokens on every request
- Graceful handling of authentication failures

### 3. Progressive Fallback
- If authentication fails, validation falls back to basic mode
- No lab enrollment creates warning but doesn't break functionality
- Clear error messages for authentication issues

### 4. Token Security
- Same secret used for NextAuth and backend verification
- Tokens include user ID, email, and role information
- Automatic token refresh prevents expiration issues

## Integration Benefits

### 1. Seamless User Experience
- No manual login to backend required
- Single sign-on between frontend and backend
- Automatic reconnection with authentication

### 2. Enhanced Validation Tracking
- User-specific validation attempts
- Progress tracking with user attribution
- Detailed analytics per user

### 3. Security Compliance
- No user credentials passed through sockets
- JWT-based authentication with verification
- Role-based access control ready

### 4. Developer Experience
- Simple React hooks for authenticated operations
- Automatic error handling and retry logic
- Type-safe user context throughout backend

## Environment Variables

### Frontend (.env.local)
```
NEXTAUTH_SECRET=your-secret-key
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Backend (.env)
```
NEXTAUTH_SECRET=your-secret-key  # Must match frontend
SERVER_PORT=3001
```

## Migration Guide

### Updating Existing Controllers

1. **Add Authentication Import**:
```typescript
import { AuthenticatedSocket } from "../../../middleware/socketAuth";
import { SocketUserService } from "../../../services/SocketUserService";
```

2. **Update Method Signatures**:
```typescript
// Before
handleValidation = async (socket: Socket, questionId: string) => {

// After
handleValidationAuthenticated = async (
  socket: AuthenticatedSocket,
  questionId: string,
  labId: string
) => {
```

3. **Extract User Context**:
```typescript
const userContext = await SocketUserService.getUserContextWithLab(socket, labId);
if (!userContext?.labEnrollmentId) {
  // Handle unauthenticated case
  return;
}
```

4. **Use ValidationTrackingService**:
```typescript
const context: ValidationContext = {
  socket,
  questionId,
  userId: userContext.userId,
  labEnrollmentId: userContext.labEnrollmentId
};

await validationTrackingService.executeValidationWithTracking(context, steps);
```

### Updating Frontend Components

1. **Replace Socket.IO Client**:
```typescript
// Before
import io from 'socket.io-client';
const socket = io('http://localhost:3001');

// After
import { useTaskValidation } from '@/hooks/useAuthenticatedSocket';
const { validateTask, isReady } = useTaskValidation();
```

2. **Update Event Handlers**:
```typescript
// Before
socket.emit('validate-task', { taskId, labId, userId });

// After
await validateTask(taskId, labId); // User context automatic
```

## Troubleshooting

### Common Issues

1. **Authentication Failed Error**
   - Check NEXTAUTH_SECRET matches between frontend and backend
   - Verify user is logged in with valid session
   - Check token endpoint `/api/auth/token` is accessible

2. **Socket Connection Refused**
   - Ensure backend is running on correct port
   - Check CORS configuration allows frontend domain
   - Verify NEXT_PUBLIC_BACKEND_URL is correct

3. **No Lab Enrollment Warning**
   - User needs to be enrolled in the lab through the database
   - Check labEnrollments table has entry for user and lab
   - Validation will fall back to basic mode without tracking

4. **Token Expiration**
   - NextAuth handles token refresh automatically
   - Check session expiration settings in NextAuth config
   - Implement retry logic for failed requests

## Testing

### Unit Tests
```bash
# Backend JWT verification
npm test -- jwt.test.ts

# Socket authentication middleware
npm test -- socketAuth.test.ts
```

### Integration Tests
```bash
# Full authentication flow
npm run test:integration
```

### Manual Testing
1. Login to frontend with Google/GitHub
2. Open browser dev tools network tab
3. Check Socket.IO connection includes auth token
4. Verify backend logs show authenticated user
5. Test validation with tracking enabled

## Future Enhancements

1. **Role-Based Validation**: Different validation rules based on user role
2. **Rate Limiting**: Per-user validation attempt limits
3. **Session Analytics**: Track user behavior across sessions
4. **Multi-Lab Progress**: Cross-lab progress tracking and achievements
