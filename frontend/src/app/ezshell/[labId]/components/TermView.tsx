'use client'

import React, { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { LoaderCircle } from 'lucide-react';
import { useAuthenticatedSocket } from '@/hooks/useAuthenticatedSocket'

export default function TermView({ questionId, labId }: { questionId: string, labId: string }) {
  const { socket, isConnected, isAuthenticated, error: socketError, connect } = useAuthenticatedSocket(labId)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isTerminalReady, setIsTerminalReady] = React.useState(false)
  const [error, setError] = React.useState('')
  const terminalRef = React.useRef<HTMLDivElement | null>(null)
  const fitAddon = React.useMemo(() => new FitAddon(), []);
  const term = React.useMemo(() => new Terminal({
    fontFamily: 'monospace',
    fontSize: 14,
    cursorBlink: true,
    cols: 80,
    rows: 24,
    scrollback: 1000,
  }), []);

  // Initialize terminal when socket is connected
  useEffect(() => {
    if (!socket || !isConnected || !terminalRef.current) {
      setIsTerminalReady(false)
      return
    }

    try {
      // Setup terminal
      term.loadAddon(fitAddon)
      term.open(terminalRef.current)
      fitAddon.fit()

      setIsTerminalReady(true)
      term.write('Welcome to ezShell Labs Terminal!\r\n')
      console.log('✅ Terminal ready!')

      // Setup terminal event handlers
      term.onResize(({ cols, rows }) => {
        socket?.emit('resize', { cols, rows })
      })

      term.onKey((e) => {
        const newMessage = {
          type: 'command',
          data: `${e.key}`
        }
        socket?.emit(newMessage.type, newMessage)
      })

      // Setup socket event handlers
      const handleTerminalOutput = (data: any) => {
        term.write(data)
      }

      const handleStdout = (data: any) => {
        term.write(data)
      }

      socket.on('terminal-output', handleTerminalOutput)
      socket.on('stdout', handleStdout)

      // Initial resize
      const initialResizeTimer = setTimeout(() => {
        fitAddon.fit()
        const { cols, rows } = term
        socket?.emit('resize', { cols, rows })
      }, 300)

      // Setup resize observer
      const observer = new window.ResizeObserver(() => {
        fitAddon.fit()
        const { cols, rows } = term
        socket?.emit('resize', { cols, rows })
      })

      if (terminalRef.current) {
        observer.observe(terminalRef.current)
      }

      // Cleanup function
      return () => {
        clearTimeout(initialResizeTimer)
        observer.disconnect()
        socket?.off('terminal-output', handleTerminalOutput)
        socket?.off('stdout', handleStdout)
        setIsTerminalReady(false)
        term.dispose()
      }
    } catch (error) {
      console.error('❌ Terminal initialization error:', error)
      setError('Failed to initialize terminal')
      setIsTerminalReady(false)
    }
  }, [socket, isConnected, term, fitAddon])

  // Handle connection state
  useEffect(() => {
    if (!isAuthenticated && !socket) {
      setIsConnecting(true)
      setError('')
    } else if (socket && !isConnected) {
      setIsConnecting(true)
    } else if (isConnected && isTerminalReady) {
      setIsConnecting(false)
      setError('')
    }
  }, [socket, isConnected, isAuthenticated, isTerminalReady])

  // Handle socket errors
  useEffect(() => {
    if (socketError) {
      setError(`Connection error: ${socketError}`)
      setIsConnecting(false)
    }
  }, [socketError])

  // Auto-connect if not connected
  useEffect(() => {
    if (isAuthenticated && !socket) {
      console.log('🔗 Auto-connecting to terminal...')
      connect().catch((err) => {
        setError(`Connection failed: ${err.message}`)
      })
    }
  }, [isAuthenticated, socket, connect])

  return (
    <>
      {(isConnecting || !isTerminalReady) && isAuthenticated && (
        <div className="flex flex-col items-center justify-center z-10 py-8">
          <span className="text-white mb-2">
            {!socket ? 'Connecting to terminal...' :
             !isConnected ? 'Establishing connection...' :
             !isTerminalReady ? 'Initializing terminal...' :
             'Loading...'}
          </span>
          <span className="mt-2 animate-spin text-white"><LoaderCircle/></span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <span className="text-red-500">{error}</span>
        </div>
      )}

      <div
        ref={terminalRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          display: isTerminalReady ? 'block' : 'none'
        }} />
    </>
  )
}
