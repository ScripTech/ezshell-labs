'use client'

import React from 'react'
import { FitAddon } from 'xterm-addon-fit';
import "@xterm/xterm/css/xterm.css"
import io from 'socket.io-client';
import { Loader2 } from "lucide-react"

const fitAddon = new FitAddon();
const socket = io('http://localhost:3001');

const MAX_RETRIES = 3
const RETRY_DELAY = 2000

export default function EZXTerminal(): JSX.Element {
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  const [loadingText, setLoadingText] = React.useState('')
  const terminalRef = React.useRef<HTMLDivElement | null>(null)

  const connectToTerminal = React.useCallback(async () => {
    try {
      // setIsConnecting(true)
      const { Terminal } = await import('xterm')
      const term = new Terminal({
        cursorBlink: true,
      })

      if (!terminalRef.current) return

      term.loadAddon(fitAddon)
      term.open(terminalRef.current)
      fitAddon.fit()

      // Setup socket connection
      socket.connect()

      socket.on('connect', () => {
        console.log('connected to ssh host')
        // Initial terminal text
        term.write('\x1B[1;32m✓\x1B[0m Connected to lab environment\r\n')
        term.write('eZLabs \x1B[1;3;31mlab-node-001\x1B[0m $ ')
        setIsConnecting(false)
        setRetryCount(0) // Reset retry count on successful connection
      })

      socket.on('connect_error', () => {
        throw new Error('Failed to connect to terminal server')
      })

      term.onResize((e) => {
        console.log(e)
      })

      term.onKey((e) => {
        const newMessage = {
          type: 'command',
          data: `${e.key}`
        };
        socket.emit(newMessage.type, newMessage);
      })

      socket.on('terminal-output', (data) => {
        term.write(data);
      });

      socket.on('stdout', (data) => {
        term.write(data);
      });

      term.clear()

      return () => {
        term.dispose()
        socket.disconnect()
      }
    } catch (error) {
      console.error('Terminal connection error:', error)
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          connectToTerminal()
        }, RETRY_DELAY)
      } else {
        setLoadingText('Connection failed. Please refresh the page to try again.')
      }
    }
  }, [retryCount])

  // Terminal initialization
  React.useEffect(() => {
    connectToTerminal().then((cleanup) => {
      return () => {
        cleanup?.()
      }
    });
  }, [connectToTerminal])

  // Matrix-like loading animation
  React.useEffect(() => {
    if (!isConnecting) return

    const messages = [
      "Initializing secure shell connection...",
      "Establishing encrypted tunnel...",
      "Loading lab environment...",
      `Retrying connection (${retryCount}/${MAX_RETRIES})...`,
      "Configuring virtual machine...",
      "Starting services...",
      "Almost ready..."
    ]

    let currentIndex = 0;
    let currentText = '';

    const typeWriter = setInterval(() => {
      if (currentIndex >= messages.length) {
        clearInterval(typeWriter);
        return;
      }

      const message = messages[currentIndex];
      if (currentText.length < message.length) {
        currentText = message.slice(0, currentText.length + 1);
        setLoadingText(currentText);
      } else {
        currentText = '';
        currentIndex++;
      }
    }, 50);

    return () => clearInterval(typeWriter);
  }, [isConnecting, retryCount]);

  if (isConnecting) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 bg-black/95 text-green-500 font-mono">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">
            {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})` : 'Connecting to Lab'}
          </span>
        </div>
        <div className="max-w-md text-center">
          <p className="text-sm typing-effect">{loadingText}</p>
        </div>
      </div>
    )
  }

  return <div ref={terminalRef} className="bg-transparent h-full" />
}
