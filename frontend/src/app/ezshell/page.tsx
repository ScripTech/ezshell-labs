"use client"

import React from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area'
import EZXTerminal from './components/terminal'
import { getExerciseData, getFirstLabQuestion } from '@/lib/services/labServices'
import { Button } from '@/components/ui/button'
import { CheckCheckIcon, LoaderCircle, LucideXCircle } from 'lucide-react'
import { io } from 'socket.io-client'
import { FaCheckCircle } from 'react-icons/fa';
import QuestionNavigator from './components/lab-exercise-navigation'
import { useSearchParams } from 'next/navigation'
import { ShellSectionComponent } from './components/shell-section'
import { TaskSection } from './components/task-section'

const socket = io('http://localhost:3001');

interface Props { }


const EZSShellView = () => {

  const [termPanelSize, setTermPanelSize] = React.useState<number>(55)
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
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.12))] bg-background'
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
