# Lab Provisioning Dialog Integration

This document describes the integration of the Lab Provisioning Dialog with the lab-provisioner microservice to provide a real-time UI for AWS lab environment provisioning.

## Overview

The Lab Provisioning Dialog provides a comprehensive UI that shows users the step-by-step process of provisioning their lab environment, including:

1. **Lab Enrollment** - Enrolling the user in the lab and queuing for provisioning
2. **AWS Instance Creation** - Creating the dedicated EC2 instance (2-3 minutes)
3. **Environment Setup** - Installing lab tools and configuring the environment (1-2 minutes)
4. **Lab Ready** - Environment is ready with SSH access and connection details

## Features

### Real-time Progress Tracking
- Visual progress bar showing completion percentage
- Step-by-step status with icons (pending, in-progress, completed, failed)
- Real-time polling of provisioning status from the lab-provisioner service
- Estimated time remaining for each step

### Error Handling & Retry
- Comprehensive error display with specific error messages
- Retry functionality for failed provisioning attempts
- Graceful handling of network errors during status polling

### Connection Information
- SSH connection details when lab is ready
- Copy-to-clipboard functionality for SSH commands
- Lab session timer showing remaining time (2 hours)
- Direct access to lab environment

### Session Management
- 2-hour lab session timer with countdown
- Automatic cleanup notification
- Session extension capabilities (future enhancement)

## Architecture

### Frontend Components

#### `LabProvisioningDialog` Component
Located at: `frontend/src/components/lab-provisioning-dialog.tsx`

**Props:**
- `isOpen: boolean` - Controls dialog visibility
- `onClose: () => void` - Callback when dialog is closed
- `labId: string` - ID of the lab to provision
- `labName: string` - Display name of the lab
- `onProvisioningComplete: (enrollmentId: string) => void` - Callback when provisioning is complete

**State Management:**
- Tracks enrollment ID and current provisioning step
- Polls lab-provisioner service every 5 seconds for status updates
- Manages error states and retry logic
- Countdown timer for lab session expiration

#### Integration in Lab Details Page
Located at: `frontend/src/app/user/labs/[id]/page.tsx`

The dialog is triggered when users click the "Enroll in Lab" button, replacing the previous immediate enrollment flow.

### Backend API Routes

#### Enrollment Proxy
`POST /api/lab-provisioner/enrollment`
- Proxies enrollment requests to the lab-provisioner service
- Handles authentication and user session validation
- Returns enrollment ID for status tracking

#### Status Checking
`GET /api/lab-provisioner/enrollment/status/[enrollmentId]`
- Retrieves real-time provisioning status from lab-provisioner
- Returns detailed information about instance state and connection details

#### Readiness Check
`GET /api/lab-provisioner/enrollment/ready/[enrollmentId]`
- Checks if lab instance is ready for use
- Provides SSH connection information when available

### Lab Provisioner Integration

The dialog integrates with the existing lab-provisioner microservice endpoints:

1. **`POST /api/enrollment/enroll`** - Creates enrollment and queues for provisioning
2. **`GET /api/enrollment/status/:enrollmentId`** - Returns detailed provisioning status
3. **`GET /api/enrollment/ready/:enrollmentId`** - Checks instance readiness

## Provisioning Flow

### 1. User Triggers Enrollment
- User clicks "Enroll in Lab" button
- Dialog opens with initial state
- User clicks "Start Lab Provisioning"

### 2. Enrollment Phase
- Frontend calls `/api/lab-provisioner/enrollment`
- Lab-provisioner creates enrollment record and queues for processing
- Kafka message published to trigger AWS provisioning
- Step 1 marked as completed

### 3. AWS Instance Creation
- Lab-provisioner receives Kafka message
- Creates EC2 instance with custom AMI
- Generates SSH key pair
- Updates database with instance details
- Step 2 marked as completed

### 4. Environment Configuration
- Instance starts and initializes
- Lab tools and dependencies installed
- Environment configured for specific lab requirements
- Public IP assigned and SSH access enabled
- Step 3 marked as completed

### 5. Lab Ready
- Instance is fully operational
- SSH connection details provided
- Lab accessible through web interface
- 2-hour timer begins countdown
- Step 4 marked as completed

## Status Polling

The dialog polls the status endpoint every 5 seconds to provide real-time updates:

```typescript
const pollProvisioningStatus = async (enrollmentId: string) => {
  const response = await fetch(`/api/lab-provisioner/enrollment/status/${enrollmentId}`)
  const status = await response.json()
  updateStepsFromStatus(status)

  if (status.provisioning.status === 'completed' && status.connection?.ready) {
    setIsPolling(false)
    onProvisioningComplete(enrollmentId)
  }
}
```

## Error Handling

### Network Errors
- Continues polling on network failures
- Shows generic error message for persistent issues
- Provides retry button for user-initiated retries

### Provisioning Errors
- Displays specific error messages from lab-provisioner
- Shows failed step with error icon
- Enables retry functionality
- Logs detailed error information for debugging

### Timeout Handling
- Maximum provisioning time: 10 minutes
- Automatic failure if timeout exceeded
- User notified with timeout message

## Environment Configuration

Add the following environment variable to enable lab-provisioner integration:

```env
# Lab Provisioner Service
LAB_PROVISIONER_URL=http://localhost:3002
```

## Usage Example

```tsx
import { LabProvisioningDialog } from '@/components/lab-provisioning-dialog'

function LabDetailsPage() {
  const [showDialog, setShowDialog] = useState(false)

  const handleEnrollment = () => {
    setShowDialog(true)
  }

  const handleProvisioningComplete = (enrollmentId: string) => {
    setShowDialog(false)
    router.push(`/ezshell?lab=${labId}&enrollment=${enrollmentId}`)
  }

  return (
    <>
      <Button onClick={handleEnrollment}>
        Enroll in Lab
      </Button>

      <LabProvisioningDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        labId={lab.id}
        labName={lab.name}
        onProvisioningComplete={handleProvisioningComplete}
      />
    </>
  )
}
```

## Future Enhancements

### Planned Features
1. **Session Extension** - Allow users to extend lab sessions
2. **Resource Monitoring** - Show CPU/memory usage of lab instance
3. **Multiple Instances** - Support for labs requiring multiple instances
4. **Snapshot Management** - Save and restore lab states
5. **Cost Tracking** - Display estimated costs for lab usage

### Performance Optimizations
1. **WebSocket Integration** - Replace polling with real-time updates
2. **Caching** - Cache status responses to reduce API calls
3. **Progressive Loading** - Load additional details on demand

## Testing

### Manual Testing Steps
1. Navigate to any lab details page
2. Click "Enroll in Lab" button
3. Verify dialog opens with correct lab information
4. Click "Start Lab Provisioning"
5. Observe real-time status updates
6. Wait for completion and verify SSH details
7. Test "Access Lab Environment" button

### Error Testing
1. Test with lab-provisioner service offline
2. Test with invalid lab IDs
3. Test with network connectivity issues
4. Test retry functionality after failures

## Troubleshooting

### Common Issues

**Dialog not opening:**
- Verify LabProvisioningDialog component is properly imported
- Check for JavaScript console errors
- Ensure dialog state management is correct

**Status not updating:**
- Verify LAB_PROVISIONER_URL environment variable
- Check lab-provisioner service is running on correct port
- Verify API proxy routes are functioning

**Provisioning failures:**
- Check lab-provisioner logs for detailed error messages
- Verify AWS credentials and permissions
- Ensure Kafka service is running (if enabled)

**SSH connection issues:**
- Verify instance is in 'running' state
- Check security group allows SSH access
- Ensure private key is properly generated

### Debug Mode

Enable detailed logging by adding to browser console:
```javascript
localStorage.setItem('debug-lab-provisioning', 'true')
```

This will log all API calls and status updates for debugging purposes.
