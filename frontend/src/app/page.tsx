"use client"
import React from 'react';
import { Button } from "@/components/ui/button";
import BaseHomeLayout from "./components/layout";
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Terminal } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleLabRequest = () => {
    router.push("/ezshell?question=question-1-network-config")
  }

  return (
    <BaseHomeLayout>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 container">
        <section className="flex flex-col items-start gap-2 py-8 md:py-12 md:pb-8 lg:py-12 lg:pb-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:leading-[1.1]">
            eZShell-Lab
          </h1>
          <p className="max-w-2xl text-lg font-light text-foreground">Interactive Linux Lab for Real-Time Practice and Validation</p>
        </section>
        <div
          className="flex flex-1 space-x-3 rounded-lg -border -border-dashed -shadow-sm" x-chunk="dashboard-02-chunk-1"
        >

          <div className="">
            <Card className={cn("w-[320px]")}>
              <CardHeader>
                <CardTitle>Linux Intermediary Lab</CardTitle>
                <CardDescription>Test your skill in Linux [CentOs]</CardDescription>
              </CardHeader>
              <CardContent>
                <img alt="" src="linux-terminal-ubuntu-sudo.avif" />
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleLabRequest()}>
                  <Terminal className="mr-2 h-4 w-4" />Request Lab
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              You have no labs
            </h3>
            <p className="text-sm text-muted-foreground">
              You can start interactng as soon as you add a lab.
            </p>
            <Button className="mt-4">Add Lab</Button>
          </div> */}
        </div>
      </main>
    </BaseHomeLayout>
  );
}
