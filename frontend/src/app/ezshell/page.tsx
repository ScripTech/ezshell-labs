"use client"

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area'
import React, { MutableRefObject, useRef } from 'react'
import EZXTerminal from './components/terminal'
import { remark } from 'remark';
import html from 'remark-html';
import { getExerciseData } from '@/lib/services/labServices'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationEllipsis, PaginationNext } from '@/components/ui/pagination'
import { CheckCheckIcon, LucideXCircle } from 'lucide-react'


interface Props { }

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


  const checkExerciseAnswer = async () => {
    sethasCheckAnswer(true)
    setIsCorrect(!isCorrect)
  }

  return (
    <div className="">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.20))] p-4 rounded-md'>
          <div className="">
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
              <TabsTrigger value="shell-content">Exercicio 1</TabsTrigger>
              <TabsTrigger value="hint-area">Help Zone</TabsTrigger>
            </TabsList>
            <TabsContent value="shell-content">
              <ScrollArea className='h-[calc(95vh_-_theme(spacing.24))]'>
                  <div className='p-3 rounded-md mb-64'>
                    <div className='prose' dangerouslySetInnerHTML={{ __html: exerciseNotes }} />

                    <div className="mt-10 space-x-4">

                      {
                      hasCheckAnswer ? (
                        isCorrect ? <Button type='button' variant={'outline'} className='border-green-700'>
                          Resposta correcta
                          <span>
                            <CheckCheckIcon className="h-5 w-5 ml-2 text-green-700" />
                          </span>
                        </Button> : <Button type='button' variant={'outline'} className='border-red-700' onClick={checkExerciseAnswer}>
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
