'use client'

import React from 'react'
import { FitAddon } from 'xterm-addon-fit';
import "@xterm/xterm/css/xterm.css"
import io from 'socket.io-client';
import { Loader2 } from "lucide-react"

const fitAddon = new FitAddon();

const MAX_RETRIES = 3
const RETRY_DELAY = 2000

export default function EZXTerminal({ questionId }: { questionId: string }): JSX.Element {
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [error, setError] = React.useState('')
  const terminalRef = React.useRef<HTMLDivElement | null>(null)
  const terminalInstance = React.useRef<any>(null)
  const socketRef = React.useRef<any>(null)

  React.useEffect(() => {
    let isMounted = true

    const connectToTerminal = async () => {
      try {
        const { Terminal } = await import('xterm')

        if (!isMounted) return

        setIsConnecting(true)

        // Cleanup previous instance if exists
        if (terminalInstance.current) {
          terminalInstance.current.dispose()
        }
        if (socketRef.current) {
          socketRef.current.disconnect()
        }

        const term = new Terminal({
          cursorBlink: true,
        })
        terminalInstance.current = term

        if (!terminalRef.current) return

        term.loadAddon(fitAddon)
        term.open(terminalRef.current)
        fitAddon.fit()

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
          term.clear()
        })

        newSocket.on('connect_error', (err) => {
          console.error('Connection error:', err)
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1)
            setTimeout(() => {
              if (isMounted) {
                connectToTerminal()
              }
            }, RETRY_DELAY)
          } else {
            setError('Connection failed. Please check if the server is running.')
            setIsConnecting(false)
          }
        })

        term.onResize((e) => {
          console.log(e)
        })

        term.onKey((e) => {
          const newMessage = {
            type: 'command',
            data: `${e.key}`
          };
          newSocket.emit(newMessage.type, newMessage);
        })

        newSocket.on('terminal-output', (data) => {
          term.write(data);
        });

        newSocket.on('stdout', (data) => {
          term.write(data);
        });
      } catch (error) {
        if (!isMounted) return

        console.error('Terminal connection error:', error)
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1)
          setTimeout(() => {
            if (isMounted) {
              connectToTerminal()
            }
          }, RETRY_DELAY)
        } else {
          setError('Connection failed. Please check if the server is running.')
          setIsConnecting(false)
        }
      }
    }

    connectToTerminal()

    // Cleanup function
    return () => {
      isMounted = false
      if (terminalInstance.current) {
        terminalInstance.current.dispose()
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [questionId]) // Only depend on questionId

  if (isConnecting || error) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 bg-black/95 text-green-500 font-mono">
        <div className="flex items-center space-x-2">
          {isConnecting && <Loader2 className="h-6 w-6 animate-spin" />}
          <span className="text-lg">
            {error || (retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})` : 'Connecting to Lab')}
          </span>
        </div>
      </div>
    )
  }

  return <div ref={terminalRef} className="bg-transparent h-full" />
}
