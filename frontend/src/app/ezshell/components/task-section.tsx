// Labtask information section component
//

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCheckIcon, LoaderCircle, LucideXCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QuestionNavigator from './lab-exercise-navigation'
import { FaCheckCircle } from 'react-icons/fa'
import React from 'react'
import { getExerciseData, getFirstLabQuestion } from '@/lib/services/labServices'
import { ScrollArea } from '@/components/ui/scroll-area'


type validationResult = {
  step: string, status: string
}

interface TaskSectionProps {
  questionId: string
  socketRef: React.RefObject<any>
}

export const TaskSection = ({ socketRef}: TaskSectionProps) => {
  const searchParams = useSearchParams()
  const questionId = searchParams.get('question') ?? ''

  const [question, setQuestion] = React.useState<string>("")
  const [exerciseNotes, setExerciseNotes] = React.useState("What about a coffe while we load data....");
  const [exerciseHint, setExerciseHint] = React.useState("No hint for you on this question.....");

  const [hasCheckAnswer, sethasCheckAnswer] = React.useState<boolean>(false)
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(false)
  const [validationStatus, setValidationStatus] = React.useState<validationResult[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);


   React.useEffect(() => {
      const handleRouteChange = async () => {
        try {
          setIsLoading(true)
          const labId = searchParams.get('lab') ?? 'EX200'
          let questionId = searchParams.get('question')

          questionId ??= await getFirstLabQuestion(labId);

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


  const checkExerciseAnswer = async (questionId: string) => {
    if (true) {
      alert('Validando resposta...')
      socketRef.current.emit(`validate-exercise`, questionId);
      socketRef.current.on(`validation-${ questionId }-step`, (data: validationResult) => {
        console.log(data)
        setValidationStatus(prevStatus => {
          const updatedStatus = prevStatus.filter(status => status.step !== data.step);
          updatedStatus.push(data);
          return updatedStatus;
        });
      })

      socketRef.current.on(`validation-${ questionId }-complete`, (data: { success: string, message: string }) => {
        console.log(data)
        if (data.success) {
          sethasCheckAnswer(true)
        }
      })

      socketRef.current.on(`validation-lab-complete`, (data: { success: string, message: string }) => {
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


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="animate-spin h-6 w-6" />
      </div>
    )
  }

  return (
    <>
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
                            Resposta correcta<span>
                              <CheckCheckIcon className="h-5 w-5 ml-2 text-green-700" />
                            </span>
                          </Button>
                        );
                      } else {
                        return (
                          <Button type='button' variant={'outline'} className='border-red-700' onClick={() => checkExerciseAnswer(question)}>
                            Reavaliar resposta<span>
                              <LucideXCircle className="h-5 w-5 ml-2 text-red-700" />
                            </span>
                          </Button>
                        );
                      }
                    } else {
                      return (
                        <Button type='button' variant={'outline'} onClick={() => checkExerciseAnswer(question)} >
                          Avaliar resposta<span>
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
        <TabsContent value="hint-area" className="h-full">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="p-3">
              <div className='prose text-sm' dangerouslySetInnerHTML={{ __html: exerciseHint }} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  )
}
