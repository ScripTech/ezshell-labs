"use client"

import React, { useState, useEffect } from 'react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { questions } from './lab-exercises';


const QuestionNavigator = () => {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const question = searchParams.get('question');
    const index = questions.findIndex(q => q.file === question);
    if (index !== -1) {
      setCurrentPage(index + 1);
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

  const handlePageChange = (page: any) => {
    const newQuestion = questions[page - 1];
    const params = new URLSearchParams(searchParams);
    params.set('question', newQuestion.file);
    router.push(`${ pathname }?${ params.toString() }`);
    setCurrentPage(page);
  };
  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-2xl font-bold">{questions[currentPage - 1].title}</h2>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              // disabled={currentPage === 1}
            />
          </PaginationItem>
          <PaginationItem>
            <div
              className={cn(
                buttonVariants({
                  variant: "outline"
                })
              )}
            >{currentPage} of {questions.length}</div>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#"
              onClick={() => handlePageChange(Math.min(questions.length, currentPage + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default QuestionNavigator;
