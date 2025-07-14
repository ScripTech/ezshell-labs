// Labtask information section component
//

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCheckIcon, LoaderCircle, LucideXCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QuestionNavigator from './lab-exercise-navigation'
import { FaCheckCircle } from 'react-icons/fa'
import React from 'react'
import { getExerciseData, getExerciseDataFromDB, getFirstLabQuestionFromDB, LabQuestion } from '@/lib/services/labServices'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { metadata } from '../../layout';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


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

          let firstLabQuestion: LabQuestion | null = null
          // Always use DB for questions
          if (!questionId) {
            firstLabQuestion = await getFirstLabQuestionFromDB(labId);
            questionId = firstLabQuestion ? firstLabQuestion.id : '';
          }

          setQuestion(questionId)
          const data = await getExerciseDataFromDB(labId, questionId)
          setExerciseNotes(firstLabQuestion ? firstLabQuestion.metadata.markdown : data.metadata.markdown)
          // setExerciseHint(data.exerciseHintHtml)
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
          // For cleanup, we'll remove listeners for both the original and all possible mapped IDs
          // This is not ideal but ensures cleanup works
          socketRef.current.off(`validation-${currentQuestion}-step`)
          socketRef.current.off(`validation-${currentQuestion}-complete`)

          // Also clean up potential mapped question IDs
          const possibleMappedIds = [
            "question-1-network-config", "question-2-yum-repository", "question-3-selinux-port",
            "question-4-user-group-management", "question-5-collaborative-directory", "question-6-cron-job",
            "question-7-autofs-configuration", "question-8-create-tar-archive", "question-9-file-permissions",
            "question-10-time-synchronization", "question-11-find-user-files", "question-12-string-search",
            "question-13-create-user", "question-14-configure-yum-repository", "question-18-configure-tuned-profile"
          ];

          possibleMappedIds.forEach(mappedId => {
            socketRef.current.off(`validation-${mappedId}-step`)
            socketRef.current.off(`validation-${mappedId}-complete`)
          });
        }
      }
    }, [searchParams])


  const checkExerciseAnswer = async (questionId: string) => {
    if (!hasCheckAnswer) {
      const labId = searchParams.get('lab') ?? 'EX200';

      try {
        // Get the task metadata to find the order for mapping
        const taskData = await getExerciseDataFromDB(labId, questionId);
        const validationQuestionId = getValidationQuestionId(questionId, taskData.metadata.order);

        console.log(`Mapping question ${questionId} (order: ${taskData.metadata.order}) to validation ID: ${validationQuestionId}`);

        // Use the legacy validation system for now with the mapped question ID
        socketRef.current.emit('validate-exercise', { labId: "ex200", questionId: validationQuestionId });

        // Listen for validation steps using the mapped questionId
        socketRef.current.on(`validation-${ validationQuestionId }-step`, (data: validationResult) => {
          console.log('Validation step:', data)
          setValidationStatus(prevStatus => {
            const updatedStatus = prevStatus.filter(status => status.step !== data.step);
            updatedStatus.push(data);
            return updatedStatus;
          });
        })

        socketRef.current.on(`validation-${ validationQuestionId }-complete`, (data: { success: string, message: string }) => {
          console.log('Validation complete:', data);
          if (data.success) {
            sethasCheckAnswer(true)
            setIsCorrect(true)
          }
        })

        socketRef.current.on(`validation-lab-complete`, (data: { success: string, message: string }) => {
          console.log("lab complete", data)
          if (data.success) {
            sethasCheckAnswer(true)
          }
        })
      } catch (error) {
        console.error('Error mapping question ID:', error);
        // Fallback to original questionId if mapping fails
        socketRef.current.emit('validate-exercise', { labId, questionId });

        socketRef.current.on(`validation-${ questionId }-step`, (data: validationResult) => {
          console.log('Validation step (fallback):', data)
          setValidationStatus(prevStatus => {
            const updatedStatus = prevStatus.filter(status => status.step !== data.step);
            updatedStatus.push(data);
            return updatedStatus;
          });
        })

        socketRef.current.on(`validation-${ questionId }-complete`, (data: { success: string, message: string }) => {
          console.log('Validation complete (fallback):', data);
          if (data.success) {
            sethasCheckAnswer(true)
            setIsCorrect(true)
          }
        })
      }
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

              <div className="prose prose-invert max-w-none rounded-lg mb-8">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, style, ...props }: React.ComponentProps<'code'> & { inline?: boolean }) {
                      const match = /language-(\w+)/.exec(className || "")
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} style={style} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {exerciseNotes}
                </ReactMarkdown>
              </div>

              <div className="mt-6 text-sm">
                {validationStatus.map((status, index) => (
                  <li key={index} className='flex space-x-2 items-center' style={{ marginBottom: '8px' }}>
                    {getStatusIcon(status.status)}
                    <span style={{ marginLeft: '8px' }}>
                      {status.step}
                      {
                        status.status === 'success' ? (<span style={{ color: 'green' }}> - Passed</span>) : (<></>)
                      }
                      {
                        status.status === 'failed' ? (<span style={{ color: 'red' }}> - Failed</span>) : (<></>)
                      }
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
                            Submit Answer<span>
                              <LucideXCircle className="h-5 w-5 ml-2 text-red-700" />
                            </span>
                          </Button>
                        );
                      }
                    } else {
                      return (
                        <Button type='button' variant={'outline'} onClick={() => checkExerciseAnswer(question)} >
                          Submit Answer<span>
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

// Question ID mapping function to convert database IDs to validation handler IDs
const getValidationQuestionId = (dbQuestionId: string, order: number): string => {
  // Map database question IDs to validation handler question IDs based on order
  const questionMap: { [key: number]: string } = {
    1: "question-1-network-config",
    2: "question-2-yum-repository",
    3: "question-3-selinux-port",
    4: "question-4-user-group-management",
    5: "question-5-collaborative-directory",
    6: "question-6-cron-job",
    7: "question-7-autofs-configuration",
    8: "question-8-create-tar-archive",
    9: "question-9-file-permissions",
    10: "question-10-time-synchronization",
    11: "question-11-find-user-files",
    12: "question-12-string-search",
    13: "question-13-create-user",
    14: "question-14-configure-yum-repository",
    18: "question-18-configure-tuned-profile"
  };

  return questionMap[order] || dbQuestionId;
};
