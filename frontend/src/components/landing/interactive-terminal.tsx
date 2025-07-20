"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Terminal, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface Command {
  input: string
  output: string[]
  success: boolean
  delay?: number
}

const demoCommands: Command[] = [
  {
    input: "ls -la /etc/httpd/conf/",
    output: [
      "total 64",
      "drwxr-xr-x  2 root root  4096 Jul 20 10:30 .",
      "drwxr-xr-x  4 root root  4096 Jul 20 10:29 ..",
      "-rw-r--r--  1 root root 11753 Jul 20 10:30 httpd.conf",
      "-rw-r--r--  1 root root  1659 Jul 20 10:29 magic"
    ],
    success: true,
    delay: 1000
  },
  {
    input: "systemctl status httpd",
    output: [
      "● httpd.service - The Apache HTTP Server",
      "   Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; vendor preset: disabled)",
      "   Active: active (running) since Sat 2025-07-20 10:30:45 UTC; 2min 15s ago",
      "     Docs: man:httpd.service(8)",
      " Main PID: 1234 (httpd)",
      "   Status: \"Processing requests...\"",
      "    Tasks: 213 (limit: 4915)",
      "   Memory: 25.3M",
      "   CGroup: /system.slice/httpd.service"
    ],
    success: true,
    delay: 1500
  },
  {
    input: "curl -I localhost",
    output: [
      "HTTP/1.1 200 OK",
      "Date: Sat, 20 Jul 2025 10:33:02 GMT",
      "Server: Apache/2.4.53 (Red Hat Enterprise Linux)",
      "Last-Modified: Sat, 20 Jul 2025 10:30:45 GMT",
      "ETag: \"d41d8cd98f00b204e9800998ecf8427e\"",
      "Accept-Ranges: bytes",
      "Content-Length: 0",
      "Content-Type: text/html; charset=UTF-8"
    ],
    success: true,
    delay: 800
  }
]

export function InteractiveTerminal() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [currentOutput, setCurrentOutput] = useState<string[]>([])
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "Welcome to ezShell Labs - Live AWS Infrastructure",
    "Connected to: ec2-user@ip-172-31-45-67.eu-north-1.compute.internal",
    ""
  ])
  const [showValidation, setShowValidation] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory, currentOutput])

  useEffect(() => {
    if (isPlaying && currentCommandIndex < demoCommands.length) {
      const command = demoCommands[currentCommandIndex]

      if (currentCharIndex < command.input.length) {
        intervalRef.current = setTimeout(() => {
          setCurrentCharIndex(prev => prev + 1)
        }, 50 + Math.random() * 50) // Realistic typing speed with variation
      } else {
        // Command typing complete, show output after delay
        setTimeout(() => {
          setCurrentOutput(command.output)
          setShowValidation(command.success)

          // Add to history after showing output
          setTimeout(() => {
            setTerminalHistory(prev => [
              ...prev,
              `[ec2-user@ezshell ~]$ ${command.input}`,
              ...command.output,
              command.success ? "✅ Task validation: PASSED" : "❌ Task validation: FAILED",
              ""
            ])
            setCurrentOutput([])
            setCurrentCharIndex(0)
            setShowValidation(false)

            if (currentCommandIndex < demoCommands.length - 1) {
              setCurrentCommandIndex(prev => prev + 1)
            } else {
              setIsPlaying(false)
            }
          }, 1500)
        }, command.delay || 1000)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
    }
  }, [isPlaying, currentCommandIndex, currentCharIndex])

  const startDemo = () => {
    setIsPlaying(true)
  }

  const pauseDemo = () => {
    setIsPlaying(false)
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
    }
  }

  const resetDemo = () => {
    setIsPlaying(false)
    setCurrentCommandIndex(0)
    setCurrentCharIndex(0)
    setCurrentOutput([])
    setShowValidation(false)
    setTerminalHistory([
      "Welcome to ezShell Labs - Live AWS Infrastructure",
      "Connected to: ec2-user@ip-172-31-45-67.eu-north-1.compute.internal",
      ""
    ])
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
    }
  }

  const currentCommand = demoCommands[currentCommandIndex]
  const typedCommand = currentCommand ? currentCommand.input.slice(0, currentCharIndex) : ""

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Terminal className="w-4 h-4" />
            <span className="text-sm font-medium">Live Terminal - Real AWS EC2</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? pauseDemo : startDemo}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDemo}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="bg-gray-900 p-4 h-96 overflow-y-auto font-mono text-sm text-green-400 leading-relaxed"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* History */}
        {terminalHistory.map((line, index) => (
          <div key={index} className={line.startsWith('✅') ? 'text-green-400 font-semibold' : line.startsWith('❌') ? 'text-red-400 font-semibold' : line.startsWith('[ec2-user@ezshell') ? 'text-blue-400' : 'text-gray-300'}>
            {line}
          </div>
        ))}

        {/* Current Command Input */}
        {currentCommand && (
          <div className="text-blue-400">
            [ec2-user@ezshell ~]$ <span className="text-white">{typedCommand}</span>
            {isPlaying && currentCharIndex < currentCommand.input.length && (
              <span className="animate-pulse">|</span>
            )}
          </div>
        )}

        {/* Current Output */}
        {currentOutput.map((line, index) => (
          <div key={index} className="text-gray-300 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${index * 100}ms` }}>
            {line}
          </div>
        ))}

        {/* Validation Feedback */}
        {showValidation && (
          <div className="text-green-400 font-semibold animate-in slide-in-from-left duration-500">
            ✅ Task validation: PASSED
          </div>
        )}

        {/* Cursor */}
        {!isPlaying && currentCommandIndex >= demoCommands.length && (
          <div className="text-blue-400">
            [ec2-user@ezshell ~]$ <span className="animate-pulse">|</span>
          </div>
        )}
      </div>

      {/* Interactive Try Button */}
      <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            This is a real AWS EC2 instance running CentOS 8 Stream
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            Try Interactive Session
          </Button>
        </div>
      </div>
    </div>
  )
}
