# Dynamic SSH Connection System

## Overview

The ezShell Labs backend has been enhanced with a dynamic SSH connection system that automatically connects users to their provisioned AWS lab environments based on URL parameters. This replaces the previous static SSH configuration with intelligent routing to user-specific lab instances.

## Architecture

### Core Components

1. **DynamicPtySessionFactory** (`src/services/DynamicPtySessionFactory.ts`)
   - Factory pattern for creating lab-specific terminal sessions
   - Handles dynamic AWS instance connections using provisioned data
   - Provides fallback to static configuration for backward compatibility

2. **LabProvisioningService** (`src/services/LabProvisioningService.ts`)
   - Service layer for querying lab provisioning data
   - Cross-microservice database access to lab-provisioner tables
   - Retrieves connection details, SSH keys, and instance status

3. **Enhanced PtySession** (`src/terminal/PtySession.ts`)
   - Updated to support both private key and password authentication
   - Dynamic SSH configuration based on lab provisioning data
   - Improved error handling and connection logging

### Database Integration

The system integrates with the lab-provisioner database tables:
- `lab_enrollments` - User lab enrollments with camelCase columns (`userId`, `labId`)
- `lab_provisions` - AWS instance details and provisioning status
- `ssh_keys` - Private key file paths for secure connections

## Usage

### Client Connection

Clients connect with lab parameters in the WebSocket handshake query:

```javascript
const socket = io(serverUrl, {
  query: {
    lab: 'lab-uuid-here',
    session: 'session-id-here'
  }
});
```

### URL Format

```
/ezshell/lab=8ee3908f-037e-4372-8450-02323b4c23ce&session=7rL0bCUF8AKZCDrTKCDOa
```

### Server-Side Processing

1. **Parameter Extraction**: Server extracts `lab` and `session` from WebSocket handshake
2. **Dynamic Session Creation**: `PtySessionFactory.createLabSession()` creates lab-specific connections
3. **Fallback Handling**: Falls back to static SSH configuration if lab data unavailable
4. **Connection Status**: Emits real-time connection status to client

## WebSocket Events

### Client Events

- `check-lab-status` - Request lab provisioning status
- `check-lab-ready` - Check if lab instance is ready for connections

### Server Events

- `lab-connection-status` - Connection status updates
  ```json
  {
    "status": "connected|error",
    "labId": "lab-uuid",
    "message": "Status message",
    "error": "Error details (if applicable)"
  }
  ```

- `lab-status` - Lab provisioning status response
  ```json
  {
    "ready": true|false,
    "details": { /* lab details */ },
    "timestamp": "ISO timestamp"
  }
  ```

- `lab-ready` - Lab readiness check response
  ```json
  {
    "labId": "lab-uuid",
    "ready": true|false,
    "timestamp": "ISO timestamp"
  }
  ```

## Configuration

### Environment Variables

```bash
# Database connection (inherited from lab-provisioner)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ezshelllabs

# SSH configuration for lab connections
LAB_SSH_USERNAME=ubuntu          # Default SSH username (ubuntu for Ubuntu instances, ec2-user for Amazon Linux)
LAB_SSH_PASSWORD=your-password   # Fallback password for SSH authentication
LAB_SSH_HOST=your-fallback-host  # Fallback SSH host (for backward compatibility)
LAB_SSH_PORT=22                  # SSH port (default: 22)
```

### SSH Key Management

The system automatically locates and uses SSH private keys from the lab-provisioner's key management:

1. **Key Discovery**: Queries `ssh_keys` table for lab-specific private keys
2. **File Path Resolution**: Reads private key files from provisioned file paths
3. **Authentication Fallback**: Falls back to password authentication if keys unavailable

## Error Handling

### Connection Failures

- **No Lab Data**: Falls back to static SSH configuration
- **Instance Not Running**: Displays helpful error messages to user
- **Missing SSH Keys**: Attempts password authentication as fallback
- **Database Errors**: Gracefully handles database connectivity issues

### User Feedback

All connection errors and status updates are communicated to the client via WebSocket events with descriptive messages.

## Testing

Run the test suite to verify functionality:

```bash
cd backend
npx ts-node src/test-dynamic-connection.ts
```

The test validates:
- ✅ TypeScript compilation
- ✅ Service layer integration
- ✅ Factory pattern implementation
- ✅ Error handling and fallbacks

## Security Considerations

1. **Key Management**: Private SSH keys are read from secure file paths
2. **User Authentication**: WebSocket connections require authenticated users
3. **Lab Isolation**: Users can only access their enrolled lab instances
4. **Fallback Security**: Static configuration provides secure fallback option

## Migration Path

### Backward Compatibility

The system maintains full backward compatibility:
- Clients without lab parameters use static SSH configuration
- Existing terminal functionality remains unchanged
- No breaking changes to existing WebSocket API

### Deployment Steps

1. Deploy updated backend with new service layer
2. Ensure lab-provisioner database is accessible
3. Configure environment variables for fallback SSH
4. Test dynamic connections with lab URL parameters
5. Monitor connection status via new WebSocket events

## Future Enhancements

- **Connection Pooling**: Optimize SSH connection reuse
- **Load Balancing**: Distribute connections across multiple lab instances
- **Monitoring**: Enhanced analytics for lab connection patterns
- **Auto-Scaling**: Dynamic lab instance provisioning based on demand

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure DATABASE_URL is correctly configured
2. **SSH Key Permissions**: Verify private key files have correct permissions
3. **Lab Provisioning**: Check that labs are properly provisioned via lab-provisioner
4. **WebSocket Parameters**: Verify client sends correct lab and session parameters

### Debug Logging

Enable detailed logging to troubleshoot connection issues:

```bash
DEBUG=ezshell:* npm start
```

The system provides comprehensive logging for:
- Lab connection attempts
- SSH authentication methods
- Database query results
- Error conditions and fallbacks
