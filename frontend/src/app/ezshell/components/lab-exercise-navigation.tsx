"use client"

import React, { useState, useEffect } from 'react'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getLabQuestions } from '@/lib/services/labServices'
import type { LabQuestion } from '@/lib/services/labServices'

interface Question extends LabQuestion {
  progress?: number
}

const QuestionNavigator = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLabQuestions = async () => {
      try {
        const labId = searchParams.get('lab') ?? 'EX200'
        const labQuestions = await getLabQuestions(labId)

        // Questions now include metadata from markdown files
        const formattedQuestions = labQuestions.map(q => ({
          ...q,
          progress: 0 // You can track progress if needed
        }))

        setQuestions(formattedQuestions)

        // Set current page based on URL
        const currentQuestion = searchParams.get('question')
        const index = formattedQuestions.findIndex(q => q.id === currentQuestion)
        setCurrentPage(index !== -1 ? index + 1 : 1)
      } catch (error) {
        console.error('Failed to fetch lab questions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLabQuestions()
  }, [searchParams])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > questions.length) return

    const newQuestion = questions[page - 1]
    const params = new URLSearchParams(searchParams)
    params.set('question', newQuestion.id)

    // Use shallow routing to prevent full page reload
    router.push(`${pathname}?${params.toString()}`)
    setCurrentPage(page)
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading questions...</div>
  }

  if (!questions.length) {
    return <div className="flex justify-center p-4">No questions available</div>
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-2xl font-bold">
        {questions[currentPage - 1]?.title || 'Loading...'}
      </h2>
      {questions[currentPage - 1]?.metadata.description && (
        <p className="text-sm text-muted-foreground">
          {questions[currentPage - 1].metadata.description}
        </p>
      )}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(currentPage - 1)
              }}
              className={cn(
                currentPage === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
          <PaginationItem>
            <div className={cn(buttonVariants({ variant: "outline" }))}>
              {currentPage} of {questions.length}
            </div>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(currentPage + 1)
              }}
              className={cn(
                currentPage === questions.length && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default QuestionNavigator
