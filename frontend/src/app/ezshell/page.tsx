"use client"

import 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area'
import React from 'react'
import EZXTerminal from './components/terminal'
import { getExerciseData } from '@/lib/services/labServices'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination'
import { CheckCheckIcon, LoaderCircleIcon, LucideXCircle } from 'lucide-react'
import { io } from 'socket.io-client'
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

const socket = io('http://localhost:3001');

interface Props { }

type validationResult = {
  step: string, status: string
}

const EZSShellView = () => {
  const [termPanelSize, setTerminalPanelSize] = React.useState<number>(25)
  const [exerciseNotes, setExercise] = React.useState("... loading data");

  const [hasCheckAnswer, sethasCheckAnswer] = React.useState<boolean>(false)
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(true)

  const getExercise = async () => {
    const exerciseData = await getExerciseData("createing-files-linux");
    return exerciseData
  }

  React.useEffect(() => {
    getExercise().then((data) => {
      setExercise(data.contentHtml);
    })
  }, [])


  const [validationStatus, setValidationStatus] = React.useState<validationResult[]>([]);

  const checkExerciseAnswer = async () => {
    if (!hasCheckAnswer){
      // Emit a validation request to the backend
      socket.emit('validate', "lab-user");
      socket.on("validation-step", (data: validationResult) => {
        console.log(data)
        setValidationStatus(prevStatus => {
          // Remove old status for the current step
          const updatedStatus = prevStatus.filter(status => status.step !== data.step);
          // Add new status for the current step
          updatedStatus.push(data);
          return updatedStatus;
        });
      })
      socket.on("validation-complete", (data: { success: string, message: string}) => {
        console.log(data)
        if(data.success){
          sethasCheckAnswer(true)
        }
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <FaSpinner className="spin" />;
      case 'success':
        return <FaCheckCircle style={{ color: 'green' }} />;
      case 'failed':
        return <FaCheckCircle style={{ color: 'red' }} />;
      default:
        return null;
    }
  };

  return (
    <div className="">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.20))] px-4 pt-2 rounded-md'>
          <div className="border-b pb-2 mb-2">
            <div className="">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
          <Tabs defaultValue="shell-content" className="w-full">
            <TabsList>
              <TabsTrigger value="shell-content" className='text-sm'>Exercicio 1</TabsTrigger>
              <TabsTrigger value="hint-area" className='text-sm'>Help Zone</TabsTrigger>
            </TabsList>
            <TabsContent value="shell-content">
              <ScrollArea className='h-[calc(95vh_-_theme(spacing.24))]'>
                  <div className='p-3 rounded-md mb-64'>
                    <div className='prose text-sm' dangerouslySetInnerHTML={{ __html: exerciseNotes }} />
                    <div className="mt-6 text-sm">
                      {validationStatus.map((status, index) => (
                        <li key={index} className='flex space-x-2 items-center' style={{ marginBottom: '8px' }}>
                          {getStatusIcon(status.status)}
                          <span style={{ marginLeft: '8px' }}>
                            {status.step}: <span style={{ color: status.status === 'success' ? 'green' : 'red' }}>
                              {status.status === 'success' ? 'Passed' : 'Failed'}
                            </span>
                          </span>
                        </li>
                      ))}
                      {/* <ul>
                        <li className='flex space-x-2 items-center'>
                          <span>File created</span>
                          <span><LoaderCircleIcon className="h-4 w-4 ml-2 animate-spin" /></span>
                        </li>
                        <li className='flex space-x-2 items-center'>
                          <span>Valid file content</span>
                          <span><LoaderCircleIcon className="h-4 w-4 ml-2 animate-spin" /></span>
                        </li>
                      </ul> */}
                    </div>
                    <div className="mt-8 space-x-4">
                      {
                      hasCheckAnswer ? (
                        isCorrect ? <Button type='button' variant={'outline'} className='border-green-700'>
                          Resposta correcta
                          <span>
                            <CheckCheckIcon className="h-5 w-5 ml-2 text-green-700" />
                          </span>
                        </Button> : <Button type='button' variant={'outline'} className='border-red-700' onClick={() => checkExerciseAnswer()}>
                          Avaliar resposta
                          <span>
                            <LucideXCircle className="h-5 w-5 ml-2 text-red-700" />
                          </span>
                        </Button>
                      ) : <Button type='button' variant={'outline'} onClick={checkExerciseAnswer} >
                          Avaliar resposta
                        <span>
                          <CheckCheckIcon className="h-5 w-5 ml-2" />
                        </span>
                      </Button>
                      }
                    </div>
                  </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="hint-area">
              <div className="p-3">
                No hint for you on this question.
              </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.16))] bg-background'
          collapsible={false}
          defaultSize={55}
          minSize={55}
          maxSize={63}
          onResize={(e) => {
            setTerminalPanelSize(e)
          }}
        >
          <ScrollArea>
            <div className={`p-2 w-[calc(55vw)]`}>
                <EZXTerminal />
              </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default EZSShellView
