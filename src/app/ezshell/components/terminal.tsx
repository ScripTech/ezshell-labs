'use client'

import {Terminal} from "@xterm/xterm"
import React, { MutableRefObject } from 'react'
import { FitAddon } from 'xterm-addon-fit';
import "@xterm/xterm/css/xterm.css"
import io from 'socket.io-client';


const fitAddon = new FitAddon();
const term: Terminal = new Terminal({
  cursorBlink: true,
});
const socket = io('http://localhost:3001');

interface WSMessage {
  type: string,
  data: string
}

export default function EZXTerminal(): JSX.Element {

  const [newMessage, setNewMessage] = React.useState<WSMessage>({
    data: "",
    type: "command"
  });

  const terminalRef: MutableRefObject<HTMLDivElement | null> = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    console.log("--------: Starting WS terminal access -------")
    if (!terminalRef.current) return
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit();
    term.write('eZLabs \x1B[1;3;31mlab-node-001\x1B[0m $ ')

    term.onKey((e) => {
      newMessage.type = 'command'
      newMessage.data = `${e.key}`
      socket.emit(newMessage.type, newMessage);
    })
    socket.on('stdout', (data) => {
      term.write(data);
    });
    term.clear();
  }, [])
  return (
    <div ref={terminalRef} className="bg-transparent"></div>
  );
}
