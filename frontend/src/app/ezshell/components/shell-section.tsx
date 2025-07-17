import dynamic from 'next/dynamic'

const TermView = dynamic(() => import('./TermView'), {
  ssr: false,
  loading: () => <p>Loading terminal...</p>
})

export const ShellSectionComponent = ({ questionId }: { questionId: string}) => {
  return (
    <div className={`p-2 w-[calc(61vw)] overflow-auto`}>
      <TermView questionId={questionId} />
    </div>
  );
}
