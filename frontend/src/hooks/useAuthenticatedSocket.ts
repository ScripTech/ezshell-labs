import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Socket } from 'socket.io-client';
import { authenticatedSocketService } from '@/services/authenticatedSocket';

export interface UseAuthenticatedSocketResult {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * React hook for managing authenticated Socket.IO connections
 */
export function useAuthenticatedSocket(labId?: string, sessionId?: string): UseAuthenticatedSocketResult {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!session?.user) {
      setError('User not authenticated');
      return;
    }

    if (!labId) {
      setError('Lab ID is required');
      return;
    }

    try {
      setError(null);
      console.log(`🔗 Connecting to lab: ${labId}${sessionId ? `, session: ${sessionId}` : ''}`);
      const socketInstance = await authenticatedSocketService.connectToLab(labId, sessionId);
      setSocket(socketInstance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [session, labId, sessionId]);

  const disconnect = useCallback(() => {
    authenticatedSocketService.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, []);

  // Auto-connect when authenticated and labId is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user && labId && !socket) {
      console.log(`🔗 Auto-connecting to lab ${labId}${sessionId ? ` with session ${sessionId}` : ''}`);
      connect();
    }
  }, [status, session, labId, sessionId, socket, connect]);

  // Setup socket event listeners
  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        setIsConnected(true);
        setError(null);
      };

      const handleDisconnect = () => {
        setIsConnected(false);
      };

      const handleConnectError = (err: Error) => {
        setIsConnected(false);
        setError(err.message);
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);

      // Check initial connection state
      if (socket.connected) {
        setIsConnected(true);
      }

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
      };
    }
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    isAuthenticated: status === 'authenticated',
    error,
    connect,
    disconnect,
  };
}

/**
 * Hook for task validation with authentication
 */
export function useTaskValidation(labId: string) {
  const { socket, isConnected, isAuthenticated } = useAuthenticatedSocket(labId);

  const validateTask = useCallback(
    async (taskId: string, labId: string, sessionData?: any) => {
      if (!socket || !isConnected || !isAuthenticated) {
        throw new Error("Socket not connected or user not authenticated");
      }

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Validation timeout"));
        }, 30000); // 30 second timeout

        // Listen for validation completion
        const handleComplete = () => {
          clearTimeout(timeout);
          socket.off(`validation-${taskId}-complete`, handleComplete);
          socket.off(`validation-${taskId}-error`, handleError);
          resolve();
        };

        const handleError = (error: any) => {
          clearTimeout(timeout);
          socket.off(`validation-${taskId}-complete`, handleComplete);
          socket.off(`validation-${taskId}-error`, handleError);
          reject(new Error(error.error || "Validation failed"));
        };

        socket.on(`validation-${taskId}-complete`, handleComplete);
        socket.on(`validation-${taskId}-error`, handleError);

        // Emit validation request
        socket.emit("validate-task", {
          taskId,
          labId,
          sessionData,
        });
      });
    },
    [socket, isConnected, isAuthenticated]
  );

  const requestProgressSummary = useCallback(
    async (labId: string) => {
      if (!socket || !isConnected || !isAuthenticated) {
        throw new Error("Socket not connected or user not authenticated");
      }

      socket.emit("request-progress-summary", { labId });
    },
    [socket, isConnected, isAuthenticated]
  );

  return {
    validateTask,
    requestProgressSummary,
    isReady: isConnected && isAuthenticated,
    socket,
  };
}
