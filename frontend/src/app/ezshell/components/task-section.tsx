// Labtask information section component
//

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCheckIcon, LoaderCircle, LucideLock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QuestionNavigator from './lab-exercise-navigation'
import { FaCheckCircle } from 'react-icons/fa'
import React from 'react'
import { getExerciseDataFromDB, getFirstLabQuestionFromDB, LabQuestion } from '@/lib/services/labServices'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import EnhancedScoringDisplay from '@/components/EnhancedScoringDisplay'
import {
  ValidationCompletedEvent,
  ValidationStepEvent,
  EnhancedScoringData,
  ValidationTrackingInfo
} from '@/types/enhanced-scoring'


type validationResult = {
  step: string, status: string
}

interface ValidationStep {
  stepNumber: number
  stepName: string
  stepDescription: string
  status: string
  passed: boolean
  score: string
  maxScore: string
  errorMessage?: string
  completedAt?: string
}

interface ValidationAttempt {
  id: string
  attemptNumber: number
  status: string
  score: string
  maxPossibleScore: string
  completedAt?: string
  steps: ValidationStep[]
}

interface ValidationHistory {
  attempts: ValidationAttempt[]
  hasAttempts: boolean
  maxAttemptsReached: boolean
  remainingAttempts: number
  totalAttempts?: number
}

interface TaskSectionProps {
  questionId: string
  socketRef: React.RefObject<any>
}

export const TaskSection = ({ socketRef}: TaskSectionProps) => {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const questionId = searchParams.get('question') ?? ''

  const [question, setQuestion] = React.useState<string>("")
  const [exerciseNotes, setExerciseNotes] = React.useState("What about a coffe while we load data....");
  const [exerciseHint, setExerciseHint] = React.useState("No hint for you on this question.....");

  const [hasCheckAnswer, sethasCheckAnswer] = React.useState<boolean>(false)
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(false)
  const [validationStatus, setValidationStatus] = React.useState<validationResult[]>([]);
  const [validationHistory, setValidationHistory] = React.useState<ValidationHistory | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);

  // Enhanced scoring state
  const [enhancedScoring, setEnhancedScoring] = React.useState<EnhancedScoringData | null>(null);
  const [validationTracking, setValidationTracking] = React.useState<ValidationTrackingInfo | null>(null);
  const [currentAttemptSteps, setCurrentAttemptSteps] = React.useState<ValidationStepEvent[]>([]);
  const [showEnhancedScoring, setShowEnhancedScoring] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch validation history for the current task
  const fetchValidationHistory = async (taskId: string, labId: string) => {
    if (!session?.user?.id) return

    try {
      const enrollmentId = searchParams.get('enrollment') // Don't use default value

      // Build query params
      const params = new URLSearchParams({
        userId: session.user.id,
        labId: labId
      })

      // Only add enrollmentId if it exists
      if (enrollmentId) {
        params.append('enrollmentId', enrollmentId)
      }

      const apiUrl = `${ process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001' }/api/validation/task/${ taskId }/detailed-history?${ params.toString() }`

      console.log('Fetching validation history from:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Validation history data:', data)

        if (data.success) {
          setValidationHistory(data.data)

          // If max attempts reached, show the latest validation results
          if (data.data.maxAttemptsReached && data.data.attempts.length > 0) {
            const latestAttempt = data.data.attempts[0] // Most recent attempt
            const validationResults = latestAttempt.steps.map((step: ValidationStep) => ({
              step: step.stepDescription,
              status: step.passed ? 'success' : 'failed'
            }))
            setValidationStatus(validationResults)
            sethasCheckAnswer(true)
            setIsCorrect(latestAttempt.status === 'completed')
            setShowHistory(true)
          }
        }
      } else {
        console.error('Failed to fetch validation history:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching validation history:', error)
    }
  }



   React.useEffect(() => {
      // Clear current attempt steps
      setCurrentAttemptSteps([]);
      // Clear previous validation status
      setValidationStatus([]);
      // Clear enhanced scoring state
      setEnhancedScoring(null);
      setValidationTracking(null);
      // Clear history state
      setValidationHistory(null);
      // Handle route change to update question and fetch data
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
          setValidationHistory(null)
          setShowHistory(false)

          // Fetch validation history for this task
          if (questionId && session?.user?.id) {
            await fetchValidationHistory(questionId, labId)
          }

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

          // Clean up enhanced scoring event listeners
          socketRef.current.off('validation-step')
          socketRef.current.off('validation-completed')
          socketRef.current.off('validation-start')
          socketRef.current.off('validation-error')
          socketRef.current.off('validation-attempts-reached')

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
      const labId = searchParams.get('lab') ?? 'invalid-lab';

      try {
        // Get the task metadata to find the order for mapping
        const taskData = await getExerciseDataFromDB(labId, questionId);
        const validationQuestionId = getValidationQuestionId(questionId, taskData.metadata.order);

        console.log(`Mapping question ${questionId} (order: ${taskData.metadata.order}) to validation ID: ${validationQuestionId}`);

        // Use the legacy validation system for now with the mapped question ID
        socketRef.current.emit('validate-exercise', {
          id: taskData.lab?.id,
          labId: taskData.lab?.labId,
          questionId: questionId,
          validationQuestionId: validationQuestionId
        });

        // Here will return the validation errors
        socketRef.current.on('validation-error', () => {
         toast(
            'Validation Error',
            {
              description: 'An error occurred during validation. Please check the console for details.',
              duration: 3000, // 3 seconds
              icon: '⚠️',
            }
          )
        })

        // here will show a toast with max attempts reached
        socketRef.current.on('validation-attempts-reached', () => {
          toast(
            'Max validation attempts reached',
            {
              description: 'You have reached the maximum number of validation attempts for this question.',
              duration: 3000, // 3 seconds
              icon: '😔',
            }
          )
        })

        // Listen for validation steps using the mapped questionId
        socketRef.current.on(`validation-${ validationQuestionId }-step`, (data: validationResult) => {
          console.log('Validation step:', data)
          setValidationStatus(prevStatus => {
            const updatedStatus = prevStatus.filter(status => status.step !== data.step);
            updatedStatus.push(data);
            return updatedStatus;
          });
        })

        // Enhanced validation step tracking
        socketRef.current.on('validation-step', (data: ValidationStepEvent) => {
          console.log('Enhanced validation step:', data);
          setCurrentAttemptSteps(prevSteps => {
            const updatedSteps = prevSteps.filter(step => step.step !== data.step);
            updatedSteps.push(data);
            return updatedSteps;
          });
        });

        // Enhanced validation completion with detailed scoring
        socketRef.current.on('validation-completed', (data: ValidationCompletedEvent) => {
          console.log('Enhanced validation completed:', data);

          // Update basic validation state
          if (data.passed) {
            sethasCheckAnswer(true);
            setIsCorrect(true);
            toast.success('Validation Passed!', {
              description: `Score: ${data.enhancedScoring?.finalScore.toFixed(1) || data.progressiveScore} points`,
              duration: 4000,
            });
          } else {
            setIsCorrect(false);
            toast.error('Validation Failed', {
              description: `${data.passedSteps}/${data.totalSteps} steps passed. Try again!`,
              duration: 4000,
            });
          }

          // Update enhanced scoring state
          if (data.enhancedScoring) {
            setEnhancedScoring(data.enhancedScoring);
            setValidationTracking(data.tracking);
            setShowEnhancedScoring(true);
          }

          // Clear current attempt steps
          // setCurrentAttemptSteps([]);

          // Refresh validation history after a short delay
          setTimeout(async () => {
            await fetchValidationHistory(questionId, labId);
          }, 500);
        });

        // Legacy validation handlers (kept for backward compatibility)
        socketRef.current.on(`validation-${ validationQuestionId }-complete`, async (data: { success: string, message: string }) => {
          console.log('Legacy validation complete:', data);
          if (data.success) {
            sethasCheckAnswer(true)
            setIsCorrect(true)
          }
        })

        socketRef.current.on(`validation-lab-complete`, async (data: { success: string, message: string }) => {
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

        socketRef.current.on(`validation-${ questionId }-complete`, async (data: { success: string, message: string }) => {
          console.log('Validation complete (fallback):', data);
          if (data.success) {
            sethasCheckAnswer(true)
            setIsCorrect(true)
          }

          // Small delay to ensure backend has saved the data, then refresh validation history
          setTimeout(async () => {
            await fetchValidationHistory(questionId, labId);
          }, 500);
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
                {/* Show validation history if available */}
                {validationHistory && validationHistory.hasAttempts && showHistory && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-900/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Previous Validation Attempts</h3>
                      <span className="text-sm text-gray-400">
                        Attempts: {validationHistory.totalAttempts || 0}/3
                      </span>
                    </div>

                    {validationHistory.maxAttemptsReached && (
                      <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-yellow-300 text-sm">
                        ⚠️ Maximum attempts reached. Results shown below.
                      </div>
                    )}

                    {validationHistory.attempts.map((attempt, attemptIndex) => (
                      <div key={attempt.id} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            Attempt #{attempt.attemptNumber}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">
                              Score: {attempt.score}/{attempt.maxPossibleScore}
                            </span>
                          </div>
                        </div>

                        <div className="ml-4 space-y-1">
                          {attempt.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-center space-x-2 text-sm">
                              {step.passed ? (
                                <FaCheckCircle style={{ color: 'green' }} className="h-3 w-3" />
                              ) : (
                                <FaCheckCircle style={{ color: 'red' }} className="h-3 w-3" />
                              )}
                              <span>
                                {step.stepDescription}
                                <span className={step.passed ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                                  - {step.passed ? 'Passed' : 'Failed'}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setShowHistory(false)}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-300"
                    >
                      Hide history
                    </button>
                  </div>
                )}


                {/* Enhanced Scoring Display */}
                {showEnhancedScoring && enhancedScoring && validationTracking && (
                  <EnhancedScoringDisplay
                    enhancedScoring={enhancedScoring}
                    tracking={validationTracking}
                    totalSteps={enhancedScoring.stepBreakdown.length}
                    passedSteps={enhancedScoring.stepBreakdown.filter(step => step.passed).length}
                    isVisible={showEnhancedScoring}
                  />
                )}

                {/* Current validation status */}
                <div className="mt-4">
                  {/* {validationStatus.map((status, index) => (
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
                  ))} */}

                </div>

                {/* Enhanced scoring display for current attempt steps */}
                {currentAttemptSteps.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Current Attempt Progress:</h4>
                    {currentAttemptSteps.map((step, index) => (
                      <li key={`current-${index}`} className='flex space-x-2 items-center mb-2'>
                        {getStatusIcon(step.status)}
                        <span style={{ marginLeft: '8px' }}>
                          {step.step}
                          {step.status === 'success' && <span style={{ color: 'green' }}> - Passed</span>}
                          {step.status === 'failed' && <span style={{ color: 'red' }}> - Failed</span>}
                          {step.status === 'running' && <span style={{ color: 'blue' }}> - Running...</span>}
                        </span>
                        {step.message && (
                          <span className="text-xs text-gray-600 ml-2">
                            {step.message}
                          </span>
                        )}
                      </li>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 space-x-4">
                {/* Show history button if there are previous attempts or after current validation completes */}
                {validationHistory && (validationHistory.hasAttempts || hasCheckAnswer) && !validationHistory.maxAttemptsReached && !showHistory && (
                  <Button
                    type='button'
                    variant={'outline'}
                    size="sm"
                    onClick={() => {
                      // Small delay to ensure backend has saved the data, then refresh validation history
                      setTimeout(async () => {
                        const labId = searchParams.get('lab') ?? 'invalid-lab';
                        await fetchValidationHistory(questionId, labId);
                      }, 500);
                      setShowHistory(true);
                    }}
                    className="mb-4"
                  >
                    Show Previous Attempts ({validationHistory.totalAttempts || 0}/3)
                  </Button>
                )}

                {/* Validation action buttons */}
                {
                  (() => {
                    if (hasCheckAnswer) {
                      if (isCorrect) {
                        return (
                          <Button type='button' variant={'outline'} className='border-green-700 bg-green-900/50'>
                            Congratulations! All validation passed<span>
                              <CheckCheckIcon className="h-5 w-5 ml-2 text-green-700" />
                            </span>
                          </Button>
                        );
                      } else {
                        return (
                          <Button type='button' variant={'outline'} disabled onClick={() => {}}>
                            Submit Answer<span>
                              <LucideLock className="h-4 w-4 ml-2 text-muted-foreground" />
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
