'use client'

import React, { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import io from 'socket.io-client';
import 'xterm/css/xterm.css'

export default function TermView({ questionId }: { questionId: string }) {
  const [isConnecting, setIsConnecting] = React.useState(false)
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

  useEffect(() => {
    // Create new socket connection
    const newSocket = io('http://localhost:3001', {
      timeout: 5000,
      reconnection: false
    })
    socketRef.current = newSocket

    if (!terminalRef.current) return

    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    // Send initial size to backend after first fit
    if (socketRef.current) {
      const { cols, rows } = term;
      socketRef.current.emit('resize', { cols, rows });
    }

    // Add a timer to trigger fit and resize again after initial load
    const initialResizeTimer = setTimeout(() => {
      fitAddon.fit();
      const { cols, rows } = term;
      newSocket.emit('resize', { cols, rows });
    }, 300);

    // ResizeObserver for responsive fit
    const observer = new window.ResizeObserver(() => {
      fitAddon.fit()
      const { cols, rows } = term;
      newSocket.emit('resize', { cols, rows });
    })
    observer.observe(terminalRef.current)

    newSocket.on('connect', () => {
      console.log('connected to ssh host')
      setIsConnecting(false)
      setRetryCount(0)
      setError('')
      const { cols, rows } = term;
      socketRef.current.emit('resize', { cols, rows });
      // term.current?.clear()
    })

    newSocket.on('connect_error', (err: any) => {
      console.error('Connection error:', err)
    })

    term.onResize(({ cols, rows }) => {
      console.log("term.current?.onResize has been called")
      newSocket.emit('resize', { cols, rows });
    })

    term.onKey((e) => {
      const newMessage = {
        type: 'command',
        data: `${ e.key }`
      };
      newSocket.emit(newMessage.type, newMessage);
    })

    newSocket.on('terminal-output', (data: any) => {
      term.write(data);
    });

    newSocket.on('stdout', (data: any) => {
      term.write(data);
    });

    return () => {
      clearTimeout(initialResizeTimer);
      observer.disconnect();
      term.dispose();
    }
  }, [questionId, fitAddon, term])

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  )
}
