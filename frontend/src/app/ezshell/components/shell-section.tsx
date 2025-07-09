import TermView from "./TermView";



export const ShellSectionComponent = ({ questionId }: { questionId: string}) => {
  return (
    <div className={`p-2 w-[calc(61vw)] overflow-auto resize resizer`}>
      <TermView questionId={questionId} />
    </div>
  );
}
