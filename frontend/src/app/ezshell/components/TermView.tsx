'use client'

import React, { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import io from 'socket.io-client';
import 'xterm/css/xterm.css'
import { LoaderCircle } from 'lucide-react';

export default function TermView({ questionId }: { questionId: string }) {
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isConnected, setIsConnected] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
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
  const socketRef = React.useRef<any>(null)
  const maxRetries = 3

  // Move connection logic outside useEffect
  const connectSocket = React.useCallback((term: Terminal, fitAddon: FitAddon, terminalRef: React.RefObject<HTMLDivElement>, setIsConnecting: any, setIsConnected: any, setRetryCount: any, setError: any, socketRef: any, maxRetries: number, retryConnection: any, attempt = 1) => {
    setIsConnecting(true)
    setError('')
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_WS ?? 'http://localhost:3001', {
      timeout: 5000,
      reconnection: false,
      transports: ['websocket'], // Ensure websocket transport
    })
    socketRef.current = socket

    if (!terminalRef.current) return

    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    // Use socket.once for connect event to avoid duplicate handlers
    socket.once('connect', () => {
      setIsConnecting(false)
      setIsConnected(true)
      setRetryCount(0)
      setError('')
      const { cols, rows } = term
      socket.emit('resize', { cols, rows })
    })

    socket.on('connect_error', (err: any) => {
      setIsConnecting(false)
      setError('Connection error: Unable to connect to backend terminal service.')
      if (attempt < maxRetries) {
        retryConnection(attempt)
      } else {
        setError('Failed to connect after multiple attempts. Please check backend status and try again.')
      }
    })

    socket.on('disconnect', () => {
      setIsConnecting(false)
      setIsConnected(false)
      setError('Connection lost. Please refresh or try again later.')
    })

    term.onResize(({ cols, rows }) => {
      socket.emit('resize', { cols, rows })
    })

    term.onKey((e) => {
      const newMessage = {
        type: 'command',
        data: `${e.key}`
      }
      socket.emit(newMessage.type, newMessage)
    })

    socket.on('terminal-output', (data: any) => {
      term.write(data)
    })

    socket.on('stdout', (data: any) => {
      term.write(data)
    })

    return socket
  }, [])

  useEffect(() => {
    let socket: any
    let retryTimeout: NodeJS.Timeout | null = null

    const retryConnection = (attempt: number) => {
      setRetryCount(attempt)
      retryTimeout = setTimeout(() => {
        connectSocket(term, fitAddon, terminalRef, setIsConnecting, setIsConnected, setRetryCount, setError, socketRef, maxRetries, retryConnection, attempt + 1)
      }, 5000) // Retry after 2 seconds
    }

    socket = connectSocket(term, fitAddon, terminalRef, setIsConnecting, setIsConnected, setRetryCount, setError, socketRef, maxRetries, retryConnection)

    const initialResizeTimer = setTimeout(() => {
      fitAddon.fit()
      const { cols, rows } = term
      socketRef.current?.emit('resize', { cols, rows })
    }, 300)

    const observer = new window.ResizeObserver(() => {
      fitAddon.fit()
      const { cols, rows } = term
      socketRef.current?.emit('resize', { cols, rows })
    })
    if (terminalRef.current) {
      observer.observe(terminalRef.current)
    }

    return () => {
      clearTimeout(initialResizeTimer)
      observer.disconnect()
      term.dispose()
      if (retryTimeout) clearTimeout(retryTimeout)
      if (socket) socket.disconnect()
    }
  }, [questionId, fitAddon, term, connectSocket])

  return (

    <>
      {isConnecting && (
        <div className="flex flex-col items-center justify-center z-10 py-8">
          <span className="text-white mb-2">Connecting to terminal...</span>
          <span className="text-white text-xs">Retry: {retryCount} / {maxRetries}</span>
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
        }} />
    </>
  )
}
