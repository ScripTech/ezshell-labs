/**
 * React hook for automatic lab connection management
 */
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { authenticatedSocketService } from '../services/authenticatedSocket';
import { getLabParametersFromUrl, LabParameters } from '../utils/labUrlUtils';

export interface UseLabSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  labParams: LabParameters;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
  connect: (labId?: string, sessionId?: string) => Promise<void>;
  disconnect: () => void;
  checkLabStatus: (labId: string) => Promise<void>;
  checkLabReady: (labId: string) => Promise<void>;
}

/**
 * Hook that automatically manages lab socket connections based on URL parameters
 */
export function useLabSocket(): UseLabSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<string>();
  const [labParams, setLabParams] = useState<LabParameters>({});

  // Connect function
  const connect = async (labId?: string, sessionId?: string) => {
    try {
      setConnectionStatus('connecting');
      setError(undefined);

      const socketInstance = await authenticatedSocketService.connectToLab(
        labId || labParams.labId || '',
        sessionId || labParams.sessionId
      );

      if (socketInstance) {
        setSocket(socketInstance);
        setConnectionStatus('connected');
        console.log('✅ Lab socket connected successfully');
      } else {
        throw new Error('Failed to establish socket connection');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown connection error');
      console.error('❌ Lab socket connection failed:', err);
    }
  };

  // Disconnect function
  const disconnect = () => {
    authenticatedSocketService.disconnect();
    setSocket(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setError(undefined);
    console.log('🔌 Lab socket disconnected');
  };

  // Lab status functions
  const checkLabStatus = async (labId: string) => {
    try {
      await authenticatedSocketService.checkLabStatus(labId);
    } catch (err) {
      console.error('Error checking lab status:', err);
    }
  };

  const checkLabReady = async (labId: string) => {
    try {
      await authenticatedSocketService.checkLabReady(labId);
    } catch (err) {
      console.error('Error checking lab readiness:', err);
    }
  };

  // Auto-connect based on URL parameters
  useEffect(() => {
    const params = getLabParametersFromUrl();
    setLabParams(params);

    // Auto-connect if lab parameters are present
    if (params.labId) {
      console.log(`🔗 Auto-connecting to lab: ${params.labId}`);
      connect(params.labId, params.sessionId);
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []); // Only run on mount

  // Listen for connection status changes
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(undefined);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleConnectError = (error: any) => {
      setIsConnected(false);
      setConnectionStatus('error');
      setError(error.message || 'Connection error');
    };

    const handleLabConnectionStatus = (data: any) => {
      console.log('🧪 Lab connection status update:', data);
      if (data.status === 'error') {
        setError(data.error || 'Lab connection error');
      }
    };

    // Attach event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('lab-connection-status', handleLabConnectionStatus);

    // Initial connection state
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup listeners
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('lab-connection-status', handleLabConnectionStatus);
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    labParams,
    connectionStatus,
    error,
    connect,
    disconnect,
    checkLabStatus,
    checkLabReady
  };
}

/**
 * Hook for manual socket management (without auto-connect)
 */
export function useManualLabSocket(): Omit<UseLabSocketReturn, 'labParams'> {
  const {
    socket,
    isConnected,
    connectionStatus,
    error,
    connect,
    disconnect,
    checkLabStatus,
    checkLabReady
  } = useLabSocket();

  // Don't auto-connect - this needs to be managed manually
  useEffect(() => {
    // Override the auto-connect behavior
    return () => {
      disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    connectionStatus,
    error,
    connect,
    disconnect,
    checkLabStatus,
    checkLabReady
  };
}
