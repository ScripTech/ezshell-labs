'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { enhancedLabService } from '../services/EnhancedLabService';

export interface EnhancedTerminalProps {
  sessionId?: string;
  userId: string;
  labId: string;
  taskId?: string;
  onCommand?: (command: string) => void;
  onOutput?: (output: string) => void;
  className?: string;
  theme?: 'dark' | 'light';
  readonly?: boolean;
}

export const EnhancedTerminal: React.FC<EnhancedTerminalProps> = ({
  sessionId,
  userId,
  labId,
  taskId,
  onCommand,
  onOutput,
  className = '',
  theme = 'dark',
  readonly = false,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPath, setCurrentPath] = useState('~');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const currentCommand = useRef('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new Terminal({
      theme: theme === 'dark' ? {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd5c5c',
        green: '#00cd00',
        yellow: '#cdcd00',
        blue: '#0000ee',
        magenta: '#cd00cd',
        cyan: '#00cdcd',
        white: '#e5e5e5',
        brightBlack: '#7f7f7f',
        brightRed: '#ff0000',
        brightGreen: '#00ff00',
        brightYellow: '#ffff00',
        brightBlue: '#5c5cff',
        brightMagenta: '#ff00ff',
        brightCyan: '#00ffff',
        brightWhite: '#ffffff',
      } : {
        background: '#ffffff',
        foreground: '#000000',
        cursor: '#000000',
      },
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      rows: 24,
      cols: 80,
      allowTransparency: false,
      macOptionIsMeta: true,
      rightClickSelectsWord: true,
      disableStdin: readonly,
    });

    // Add addons
    fitAddon.current = new FitAddon();
    terminal.loadAddon(fitAddon.current);

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.current.fit();

    terminalInstance.current = terminal;

    // Initialize with welcome message
    terminal.writeln('\x1b[1;32m╔══════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[1;32m║           EZ Shell Labs              ║\x1b[0m');
    terminal.writeln('\x1b[1;32m║        Enhanced Terminal             ║\x1b[0m');
    terminal.writeln('\x1b[1;32m╚══════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');
    terminal.writeln('\x1b[33mConnecting to lab environment...\x1b[0m');

    // Set up event listeners
    if (!readonly) {
      setupTerminalInput(terminal);
    }

    setupWebSocketEvents();

    // Handle resize
    const handleResize = () => {
      fitAddon.current?.fit();
    };

    window.addEventListener('resize', handleResize);

    // Connect to lab session
    connectToLabSession();

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupWebSocketEvents();
      terminal.dispose();
    };
  }, [sessionId, userId, labId, taskId, readonly, theme]);

  const setupTerminalInput = (terminal: Terminal) => {
    let currentLine = '';
    let cursorPosition = 0;

    terminal.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.keyCode === 13) { // Enter
        terminal.write('\r\n');
        if (currentLine.trim()) {
          executeCommand(currentLine.trim());
          setCommandHistory(prev => [...prev, currentLine.trim()]);
          setHistoryIndex(-1);
        }
        currentLine = '';
        cursorPosition = 0;
        currentCommand.current = '';
      } else if (domEvent.keyCode === 8) { // Backspace
        if (cursorPosition > 0) {
          currentLine = currentLine.slice(0, cursorPosition - 1) + currentLine.slice(cursorPosition);
          cursorPosition--;
          terminal.write('\b \b');
          if (cursorPosition < currentLine.length) {
            // Redraw the rest of the line
            terminal.write(currentLine.slice(cursorPosition) + ' ');
            for (let i = 0; i <= currentLine.length - cursorPosition; i++) {
              terminal.write('\b');
            }
          }
          currentCommand.current = currentLine;
        }
      } else if (domEvent.keyCode === 37) { // Left arrow
        if (cursorPosition > 0) {
          cursorPosition--;
          terminal.write('\x1b[D');
        }
      } else if (domEvent.keyCode === 39) { // Right arrow
        if (cursorPosition < currentLine.length) {
          cursorPosition++;
          terminal.write('\x1b[C');
        }
      } else if (domEvent.keyCode === 38) { // Up arrow - history
        if (commandHistory.length > 0) {
          const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
          if (newIndex !== historyIndex) {
            setHistoryIndex(newIndex);
            const historyCommand = commandHistory[commandHistory.length - 1 - newIndex];

            // Clear current line
            terminal.write('\r\x1b[K');
            terminal.write(getPrompt());

            currentLine = historyCommand;
            cursorPosition = currentLine.length;
            terminal.write(currentLine);
            currentCommand.current = currentLine;
          }
        }
      } else if (domEvent.keyCode === 40) { // Down arrow - history
        if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          const historyCommand = commandHistory[commandHistory.length - historyIndex];

          // Clear current line
          terminal.write('\r\x1b[K');
          terminal.write(getPrompt());

          currentLine = historyCommand;
          cursorPosition = currentLine.length;
          terminal.write(currentLine);
          currentCommand.current = currentLine;
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          // Clear current line
          terminal.write('\r\x1b[K');
          terminal.write(getPrompt());
          currentLine = '';
          cursorPosition = 0;
          currentCommand.current = '';
        }
      } else if (domEvent.keyCode === 9) { // Tab - autocomplete
        domEvent.preventDefault();
        if (currentLine.trim()) {
          requestAutoComplete(currentLine);
        }
      } else if (domEvent.keyCode === 3) { // Ctrl+C
        terminal.write('^C\r\n');
        terminal.write(getPrompt());
        currentLine = '';
        cursorPosition = 0;
        currentCommand.current = '';
      } else if (printable) {
        currentLine = currentLine.slice(0, cursorPosition) + key + currentLine.slice(cursorPosition);
        cursorPosition++;

        if (cursorPosition === currentLine.length) {
          terminal.write(key);
        } else {
          // Insert character and redraw rest of line
          terminal.write(key + currentLine.slice(cursorPosition));
          for (let i = 0; i < currentLine.length - cursorPosition; i++) {
            terminal.write('\b');
          }
        }
        currentCommand.current = currentLine;
      }
    });
  };

  const setupWebSocketEvents = () => {
    const handleConnected = () => {
      setIsConnected(true);
      terminalInstance.current?.writeln('\x1b[32m✓ Connected to lab environment\x1b[0m');
      terminalInstance.current?.write(getPrompt());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      terminalInstance.current?.writeln('\x1b[31m✗ Disconnected from lab environment\x1b[0m');
    };

    const handleTerminalOutput = (data: { output: string; type?: string }) => {
      if (terminalInstance.current) {
        const output = data.output;
        terminalInstance.current.write(output);
        onOutput?.(output);
      }
    };

    const handleCommandResult = (data: { command: string; output: string; exitCode: number; duration: number }) => {
      if (terminalInstance.current) {
        terminalInstance.current.write(data.output);
        if (data.exitCode !== 0) {
          terminalInstance.current.writeln(`\x1b[31m[Exit code: ${data.exitCode}]\x1b[0m`);
        }
        terminalInstance.current.write('\r\n' + getPrompt());
      }
    };

    const handlePathChanged = (data: { path: string }) => {
      setCurrentPath(data.path);
    };

    const handleAutoComplete = (data: { suggestions: string[]; commonPrefix: string }) => {
      if (data.suggestions.length === 1) {
        // Auto-complete with the single suggestion
        const suggestion = data.suggestions[0];
        terminalInstance.current?.write(suggestion.slice(currentCommand.current.length));
        currentCommand.current += suggestion.slice(currentCommand.current.length);
      } else if (data.suggestions.length > 1) {
        // Show suggestions
        terminalInstance.current?.writeln('');
        const columns = Math.floor(80 / 20); // Assuming 20 chars per column
        for (let i = 0; i < data.suggestions.length; i += columns) {
          const row = data.suggestions.slice(i, i + columns);
          terminalInstance.current?.writeln(row.map(s => s.padEnd(20)).join(''));
        }
        terminalInstance.current?.write(getPrompt() + currentCommand.current);
      }
    };

    // Add WebSocket event listeners
    enhancedLabService.on('terminal-connected', handleConnected);
    enhancedLabService.on('terminal-disconnected', handleDisconnected);
    enhancedLabService.on('terminal-output', handleTerminalOutput);
    enhancedLabService.on('command-result', handleCommandResult);
    enhancedLabService.on('path-changed', handlePathChanged);
    enhancedLabService.on('autocomplete-result', handleAutoComplete);

    return () => {
      enhancedLabService.off('terminal-connected', handleConnected);
      enhancedLabService.off('terminal-disconnected', handleDisconnected);
      enhancedLabService.off('terminal-output', handleTerminalOutput);
      enhancedLabService.off('command-result', handleCommandResult);
      enhancedLabService.off('path-changed', handlePathChanged);
      enhancedLabService.off('autocomplete-result', handleAutoComplete);
    };
  };

  const cleanupWebSocketEvents = setupWebSocketEvents;

  const connectToLabSession = async () => {
    try {
      // The service should already be connected when the component is used
      if (sessionId) {
        await enhancedLabService.joinLabSession(sessionId);
      }
    } catch (error) {
      console.error('Failed to connect to lab session:', error);
      terminalInstance.current?.writeln('\x1b[31m✗ Failed to connect to lab environment\x1b[0m');
    }
  };

  const executeCommand = async (command: string) => {
    try {
      onCommand?.(command);

      // Send command to backend via WebSocket
      enhancedLabService.sendTerminalCommand(command, sessionId, taskId);

    } catch (error) {
      console.error('Error executing command:', error);
      terminalInstance.current?.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      terminalInstance.current?.write('\r\n' + getPrompt());
    }
  };

  const requestAutoComplete = (partial: string) => {
    enhancedLabService.requestAutoComplete(partial, sessionId, currentPath);
  };

  const getPrompt = (): string => {
    const user = 'student';
    const host = 'lab-server';
    const path = currentPath === '/home/student' ? '~' : currentPath;
    return `\x1b[32m${user}@${host}\x1b[0m:\x1b[34m${path}\x1b[0m$ `;
  };

  const clearTerminal = () => {
    terminalInstance.current?.clear();
  };

  const searchInTerminal = (term: string) => {
    // Search functionality would need to be implemented with the search addon
    // For now, we'll just log the search term
    console.log('Search term:', term);
  };

  const copySelection = () => {
    if (terminalInstance.current?.hasSelection()) {
      const selection = terminalInstance.current.getSelection();
      navigator.clipboard.writeText(selection);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      terminalInstance.current?.write(text);
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  return (
    <div className={`terminal-container ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {sessionId && (
            <div className="text-gray-300">
              Session: {sessionId.slice(0, 8)}...
            </div>
          )}
          {taskId && (
            <div className="text-gray-300">
              Task: {taskId}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearTerminal}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            title="Clear Terminal"
          >
            Clear
          </button>
          <button
            onClick={copySelection}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            title="Copy Selection"
          >
            Copy
          </button>
          <button
            onClick={pasteFromClipboard}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            title="Paste"
          >
            Paste
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="terminal-content"
        style={{
          height: '500px',
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        }}
      />
    </div>
  );
};
