"use client"

import React from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { io } from 'socket.io-client'
import { ShellSectionComponent } from './components/shell-section'
import { TaskSection } from './components/task-section'

const socket = io(process.env.BACKEND_WS ?? 'http://localhost:3001', {
    timeout: 5000,
    reconnection: false
})

interface Props { }

const EZSShellView = () => {

  const [termPanelSize, setTermPanelSize] = React.useState<number>(63)
  const socketRef = React.useRef(socket);

  React.useEffect(() => {
    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  return (
    <div className="container-shell">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.20))] px-4 pt-2 rounded-md'>
            <TaskSection socketRef={socketRef} questionId={''}/>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.12))] bg-background rounded-sm'
          collapsible={false}
          defaultSize={55}
          minSize={termPanelSize}
          maxSize={63}
          onResize={(e) => {
            setTermPanelSize(e)
          }}
        >
          <ScrollArea>
            <ShellSectionComponent questionId={""}/>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default EZSShellView
