import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from '@/components/ui/scroll-area'
import React, { MutableRefObject, useRef } from 'react'
import Xterm from "@xterm/xterm"
import EZXTerminal from './components/terminal'


interface Props { }

const EZSShellView = () => {

  return (
    <div className="">

      <div className=""></div>

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className='h-[calc(100vh_-_theme(spacing.20))] p-4 rounded-md'>

          <Tabs defaultValue="shell-content" className="w-full">
            <TabsList>
              <TabsTrigger value="shell-content">Can you?</TabsTrigger>
              <TabsTrigger value="hint-area">Hint Zone</TabsTrigger>
            </TabsList>
            <TabsContent value="shell-content">
              <ScrollArea>
                <div className="min-h-screen">
                  <div className='p-3 rounded-md mb-64'>1 - Crei um directorio de nome [python] e nele crie um ficher de nome[mensagem] que tenha presente a seguinte conteudo: "eKuroZetsu @ DevOps Automation" </div>
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
        >
          <ScrollArea>
            <div className="p-2">
              <EZXTerminal />
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
export default EZSShellView
