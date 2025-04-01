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

const socket = io('http://localhost:3001');

interface Props { }

type validationResult = {
  step: string, status: string
}

const EZSShellView = () => {
  const searchParams = useSearchParams()
  const questionId = searchParams.get('question') || ''

  const [question, setQuestion] = React.useState<string>("")
  const [termPanelSize, setTermPanelSize] = React.useState<number>(55)
  const [exerciseNotes, setExerciseNotes] = React.useState("What about a coffe while we load data....");
  const [exerciseHint, setExerciseHint] = React.useState("No hint for you on this question.....");
  const [isLoading, setIsLoading] = React.useState(true);

  const [hasCheckAnswer, sethasCheckAnswer] = React.useState<boolean>(false)
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(false)

  const socketRef = React.useRef(socket);

  React.useEffect(() => {
    const handleRouteChange = async () => {
      try {
        setIsLoading(true)
        const labId = searchParams.get('lab') ?? 'EX200'
        let questionId = searchParams.get('question')

        if (!questionId) {
          questionId = await getFirstLabQuestion(labId)
        }

        setQuestion(questionId)

        const data = await getExerciseData(labId, questionId)
        setExerciseNotes(data.exerciseHtml)
        setExerciseHint(data.exerciseHintHtml)
        sethasCheckAnswer(false)
        setValidationStatus([])
      } catch (error) {
        console.error('Failed to update exercise:', error)
      } finally {
        setIsLoading(false)
      }
    }

    handleRouteChange()

    return () => {
      const currentQuestion = searchParams.get('question')
      if (currentQuestion) {
        socketRef.current.off(`validation-${currentQuestion}-step`)
        socketRef.current.off(`validation-${currentQuestion}-complete`)
      }
    }
  }, [searchParams])

  React.useEffect(() => {
    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  const [validationStatus, setValidationStatus] = React.useState<validationResult[]>([]);

  const checkExerciseAnswer = async (questionId: string) => {
    if (!hasCheckAnswer){
      socketRef.current.emit(`validate-exercise`, questionId);
      socketRef.current.on(`validation-${questionId}-step`, (data: validationResult) => {
        console.log(data)
        setValidationStatus(prevStatus => {
          const updatedStatus = prevStatus.filter(status => status.step !== data.step);
          updatedStatus.push(data);
          return updatedStatus;
        });
      })

      socketRef.current.on(`validation-${questionId}-complete`, (data: { success: string, message: string}) => {
        console.log(data)
        if(data.success){
          sethasCheckAnswer(true)
        }
      })

      socketRef.current.on(`validation-lab-complete`, (data: { success: string, message: string}) => {
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
        return <LoaderCircle className="spin animate-spin h-4 w-4" />;
      case 'success':
        return <FaCheckCircle style={{ color: 'green' }} />;
      case 'failed':
        return <FaCheckCircle style={{ color: 'red' }} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="animate-spin h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="container-shell">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.20))] px-4 pt-2 rounded-md'>
          <div className="border-b pb-2 mb-2">
            <div className="">
              <QuestionNavigator />
            </div>
          </div>
          <Tabs defaultValue="shell-content" className="w-full">
            <TabsList>
              <TabsTrigger value="shell-content" className='text-sm'>Exercicio</TabsTrigger>
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
                    </div>
                    <div className="mt-8 space-x-4">
                      {
                        (() => {
                          if (hasCheckAnswer) {
                            if (isCorrect) {
                              return (
                                <Button type='button' variant={'outline'} className='border-green-700 bg-green-900/50'>
                                  Resposta correcta
                                  <span>
                                    <CheckCheckIcon className="h-5 w-5 ml-2 text-green-700" />
                                  </span>
                                </Button>
                              );
                            } else {
                              return (
                                <Button type='button' variant={'outline'} className='border-red-700' onClick={() => checkExerciseAnswer(question)}>
                                  Avaliar resposta
                                  <span>
                                    <LucideXCircle className="h-5 w-5 ml-2 text-red-700" />
                                  </span>
                                </Button>
                              );
                            }
                          } else {
                            return (
                              <Button type='button' variant={'outline'} onClick={() => checkExerciseAnswer(question)} >
                                Avaliar resposta
                                <span>
                                  <CheckCheckIcon className="h-5 w-5 ml-2" />
                                </span>
                              </Button>
                            );
                          }
                        })()
                      }
                    </div>
                  </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="hint-area">
              <div className="p-3">
                <div className='prose text-sm' dangerouslySetInnerHTML={{ __html: exerciseHint }} />
              </div>
            </TabsContent>
          </Tabs>
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
            <div className={`p-2 w-[calc(55vw)]`}>
                <EZXTerminal questionId={questionId} />
              </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default EZSShellView
