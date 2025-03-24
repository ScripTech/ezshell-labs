'use client'

import QuestionNavigator from '@/app/ezshell/components/lab-exercise-navigation';
import EZXTerminal from '@/app/ezshell/components/terminal';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { getExerciseData } from '@/lib/services/labServices';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { CheckCheckIcon, LoaderCircle, LucideXCircle } from 'lucide-react';
import { NextPage } from 'next'
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

interface Props { }

type validationResult = {
  step: string, status: string
}

const LabWorkspace: NextPage<Props> = () => {

  const searchParams = useSearchParams();
  const [question, setQuestion] = React.useState<string>("question_1_network_config")
  const [termPanelSize, setTerminalPanelSize] = React.useState<number>(25)
  const [exerciseNotes, setExercise] = React.useState("What about a coffe while we load data....");
  const [exerciseHint, setExerciseHint] = React.useState("No hint for you on this question.....");

  const [hasCheckAnswer, sethasCheckAnswer] = React.useState<boolean>(false)
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(true)

  const getExercise = async (id: string) => {
    const exerciseData = await getExerciseData(id);
    return exerciseData
  }

  // Here i'm navigating to get the correct exercise question
  React.useEffect(() => {
    const _question = searchParams.get('question');
    setQuestion(_question ?? "question_1_network_config");
    getExercise(_question ?? "question_1_network_config").then((data) => {
      setExercise(data.exerciseHtml);
      setExerciseHint(data.exerciseHintHtml)
    })

    setValidationStatus([])
  }, [searchParams]);


  const [validationStatus, setValidationStatus] = React.useState<validationResult[]>([]);

  const checkExerciseAnswer = async (questionId: string) => {
    if (!hasCheckAnswer) {
      // Emit a validation request to the backend
      socket.emit(`validate-exercise`, questionId);
      socket.on(`validation-${ questionId }-step`, (data: validationResult) => {
        console.log(data)
        setValidationStatus(prevStatus => {
          // Remove old status for the current step
          const updatedStatus = prevStatus.filter(status => status.step !== data.step);
          // Add new status for the current step
          updatedStatus.push(data);
          return updatedStatus;
        });
      })

      socket.on(`validation-${ questionId }-complete`, (data: { success: string, message: string }) => {
        console.log(data)
        if (data.success) {
          sethasCheckAnswer(true)
        }
      })

      socket.on(`validation-lab-complete`, (data: { success: string, message: string }) => {
        console.log(data)
        if (data.success) {
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

  return (
    <div className="">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.20))] px-4 pt-2 rounded-md bg-muted/40'>
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
                      hasCheckAnswer ? (
                        isCorrect ? <Button type='button' variant={'outline'} className='border-green-700'>
                          Resposta correcta
                          <span>
                            <CheckCheckIcon className="h-5 w-5 ml-2 text-green-700" />
                          </span>
                        </Button> : <Button type='button' variant={'outline'} className='border-red-700' onClick={() => checkExerciseAnswer(question)}>
                          Avaliar resposta
                          <span>
                            <LucideXCircle className="h-5 w-5 ml-2 text-red-700" />
                          </span>
                        </Button>
                      ) : <Button type='button' variant={'outline'} onClick={() => checkExerciseAnswer(question)} >
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
                <div className='prose text-sm' dangerouslySetInnerHTML={{ __html: exerciseHint }} />
              </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.12))] bg-background'
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
export default LabWorkspace;
