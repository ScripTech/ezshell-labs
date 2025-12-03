# Frontend Integration Guide: Dynamic Lab Socket Connections

## Overview

The frontend has been enhanced to support dynamic lab connections via URL parameters. The `AuthenticatedSocketService` now automatically connects to specific lab environments based on `lab` and `session` parameters in the URL.

## Key Changes

### 1. Enhanced AuthenticatedSocketService

**File**: `frontend/src/services/authenticatedSocket.ts`

**New Features**:
- **Lab Parameter Support**: Accepts `labId` and `sessionId` in connection
- **Smart Reconnection**: Automatically reconnects when lab parameters change
- **Lab-Specific Events**: Handles `lab-connection-status`, `lab-status`, `lab-ready` events
- **Connection Management**: Tracks current lab parameters and connection state

**New Methods**:
```typescript
// Connect to a specific lab
await authenticatedSocketService.connectToLab(labId, sessionId);

// Check lab status
await authenticatedSocketService.checkLabStatus(labId);

// Check lab readiness
await authenticatedSocketService.checkLabReady(labId);

// Get current lab info
const { labId, sessionId } = authenticatedSocketService.getCurrentLabInfo();
```

### 2. URL Parameter Utilities

**File**: `frontend/src/utils/labUrlUtils.ts`

**Functions**:
```typescript
// Extract lab parameters from current URL
const { labId, sessionId } = getLabParametersFromUrl();

// Extract from specific URL string
const params = getLabParametersFromUrlString(url);

// Build URL with lab parameters
const labUrl = buildLabUrl('/ezshell', labId, sessionId);

// Check if URL has lab parameters
const hasLab = hasLabParameters();
```

### 3. React Hooks

**File**: `frontend/src/hooks/useLabSocket.ts`

**Hooks**:
```typescript
// Auto-connect based on URL parameters
const {
  socket,
  isConnected,
  labParams,
  connectionStatus,
  error,
  connect,
  disconnect,
  checkLabStatus,
  checkLabReady
} = useLabSocket();

// Manual connection management
const { socket, isConnected, connect, disconnect } = useManualLabSocket();
```

## Integration Examples

### 1. Terminal Component Integration

```typescript
// In your terminal component
import { useLabSocket } from '../hooks/useLabSocket';

export function TerminalComponent() {
  const { socket, isConnected, labParams, error } = useLabSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for terminal output
    socket.on('stdout', (data) => {
      // Handle terminal output
    });

    // Listen for lab connection status
    socket.on('lab-connection-status', (status) => {
      if (status.status === 'connected') {
        console.log('✅ Connected to lab:', status.labId);
      } else if (status.status === 'error') {
        console.error('❌ Lab connection error:', status.error);
      }
    });

    return () => {
      socket.off('stdout');
      socket.off('lab-connection-status');
    };
  }, [socket]);

  if (!isConnected) {
    return <div>Connecting to lab...</div>;
  }

  return (
    <div>
      {/* Your terminal UI */}
      {labParams.labId && (
        <div>Connected to Lab: {labParams.labId}</div>
      )}
    </div>
  );
}
```

### 2. Lab Status Component

```typescript
import { useLabSocket } from '../hooks/useLabSocket';

export function LabStatusComponent() {
  const { checkLabStatus, checkLabReady, labParams } = useLabSocket();
  const [status, setStatus] = useState(null);

  const handleCheckStatus = async () => {
    if (labParams.labId) {
      await checkLabStatus(labParams.labId);
    }
  };

  return (
    <div>
      <button onClick={handleCheckStatus}>
        Check Lab Status
      </button>
      {/* Status display */}
    </div>
  );
}
```

### 3. Page Component with Auto-Connection

```typescript
import { useLabSocket } from '../hooks/useLabSocket';
import { getLabParametersFromUrl } from '../utils/labUrlUtils';

export default function EzShellPage() {
  const { socket, isConnected, connectionStatus, error } = useLabSocket();

  // The hook automatically connects based on URL parameters
  // No manual connection needed!

  return (
    <div>
      {connectionStatus === 'connecting' && (
        <div>Connecting to your lab environment...</div>
      )}

      {connectionStatus === 'connected' && (
        <div>✅ Connected to lab environment</div>
      )}

      {connectionStatus === 'error' && (
        <div>❌ Connection error: {error}</div>
      )}

      {/* Your app components */}
    </div>
  );
}
```

## URL Patterns

### Standard Lab Connection
```
/ezshell/8ee3908f-037e-4372-8450-02323b4c23ce
```

### Lab with Session
```
/ezshell/8ee3908f-037e-4372-8450-02323b4c23ce/?session=7rL0bCUF8AKZCDrTKCDOa
```

### Multiple Parameters
```
/ezshell/8ee3908f-037e-4372-8450-02323b4c23ce/?session=7rL0bCUF8AKZCDrTKCDOa&step=1
```

## Event Handling

### Lab-Specific Events

```typescript
// Listen for lab connection status
socket.on('lab-connection-status', (data) => {
  /*
  data = {
    status: 'connected' | 'error',
    labId: string,
    message?: string,
    error?: string
  }
  */
});

// Listen for lab status response
socket.on('lab-status', (data) => {
  /*
  data = {
    ready: boolean,
    details: object | null,
    timestamp: string
  }
  */
});

// Listen for lab readiness response
socket.on('lab-ready', (data) => {
  /*
  data = {
    labId: string,
    ready: boolean,
    timestamp: string
  }
  */
});
```

## Testing

### Test Component
A complete test component is available at `frontend/src/components/LabSocketTest.tsx` that demonstrates:

- Auto-connection based on URL parameters
- Manual connection management
- Lab status checking
- Real-time event handling
- Connection state management

### Usage
```typescript
import LabSocketTest from '../components/LabSocketTest';

export default function TestPage() {
  return <LabSocketTest />;
}
```

## Migration Guide

### From Static to Dynamic Connections

1. **Replace direct socket.io usage**:
   ```typescript
   // Before
   const socket = io(backendUrl, { auth: { token } });

   // After
   const { socket } = useLabSocket();
   ```

2. **Update connection logic**:
   ```typescript
   // Before - manual connection
   useEffect(() => {
     connectToSocket();
   }, []);

   // After - automatic based on URL
   const { socket, isConnected } = useLabSocket();
   ```

3. **Add lab parameter handling**:
   ```typescript
   // Extract lab info
   const { labParams } = useLabSocket();

   // Use in components
   if (labParams.labId) {
     // Show lab-specific UI
   }
   ```

## Environment Variables

Ensure these are set in your frontend environment:

```bash
# Backend WebSocket URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Other existing variables...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
```

## Best Practices

1. **Use the hook pattern**: Prefer `useLabSocket()` over direct service usage
2. **Handle connection states**: Always check `connectionStatus` before UI operations
3. **Error handling**: Display connection errors to users
4. **Cleanup**: Hooks handle cleanup automatically, but manual usage needs disconnection
5. **URL parameters**: Use utility functions for consistent parameter extraction

## Next Steps

1. **Update existing terminal components** to use `useLabSocket()`
2. **Add lab connection status indicators** to the UI
3. **Implement lab readiness checks** before allowing terminal usage
4. **Add error recovery mechanisms** for connection failures
5. **Test with real lab URLs** containing lab and session parameters

The frontend is now ready to automatically connect to user-specific lab environments based on URL parameters, providing a seamless lab experience!
