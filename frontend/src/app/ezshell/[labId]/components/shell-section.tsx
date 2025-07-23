import dynamic from 'next/dynamic'

const TermView = dynamic(() => import('./TermView'), {
  ssr: false,
  loading: () => <p>Loading terminal...</p>
})

export const ShellSectionComponent = ({ questionId, labId }: { questionId: string, labId: string }) => {
  return (
    <div className="p-2 w-full h-full overflow-hidden">
      <TermView questionId={questionId} labId={labId} />
    </div>
  );
}
