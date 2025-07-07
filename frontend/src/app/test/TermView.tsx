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
  const term = useRef<Terminal | null>(null)
  const terminalInstance = React.useRef<any>(null)
  const socketRef = React.useRef<any>(null)
  const fitAddon = useRef<FitAddon | null>(null)



  useEffect(() => {
    if (!terminalRef.current) return

    term.current = new Terminal({
      fontFamily: 'monospace',
      fontSize: 14,
      cursorBlink: true,
      cols: 80,
      rows: 24,
      scrollback: 1000,
    })
    fitAddon.current = new FitAddon()
    term.current.loadAddon(fitAddon.current)
    term.current.open(terminalRef.current)
    fitAddon.current.fit()

    // ResizeObserver for responsive fit
    const observer = new window.ResizeObserver(() => {
      fitAddon.current?.fit()
    })
    observer.observe(terminalRef.current)


    term.current.onKey((e) => {
      term.current?.write(e.key);
    })


    // Create new socket connection
    const newSocket = io('http://localhost:3001', {
      timeout: 5000,
      reconnection: false
    })
    socketRef.current = newSocket

    newSocket.on('connect', () => {
      console.log('connected to ssh host')
      setIsConnecting(false)
      setRetryCount(0)
      setError('')
      // term.write('\x1B[1;32m✓\x1B[0m Connected to lab environment\r\n')
      term.current?.clear()
    })

    newSocket.on('connect_error', (err: any) => {
      console.error('Connection error:', err)
    })

    term.current?.onResize((e) => {
      console.log(e)
    })

    term.current?.onKey((e) => {
      const newMessage = {
        type: 'command',
        data: `${ e.key }`
      };
      newSocket.emit(newMessage.type, newMessage);
    })

    newSocket.on('terminal-output', (data: any) => {
      term.current?.write(data);
    });

    newSocket.on('stdout', (data: any) => {
      term.current?.write(data);
    });

    // // Input handling
    // term.current.onData((data) => {
    //   // Replace with your backend/pty handler
    //   window.external?.TermData?.(data)
    // })

    // Output handler (replace with your backend/pty handler)
    // window.external.PtyData = (data: string) => {
    //   term.current?.write(data)
    // }

    // Initial PTY setup
    // window.external?.InitPty?.(term.current.cols, term.current.rows, solutionDirectory)

    return () => {
      observer.disconnect()
      term.current?.dispose()
    }
  }, [questionId])

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    />
  )
}
