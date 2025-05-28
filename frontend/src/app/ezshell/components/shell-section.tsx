import EZXTerminal from "./terminal";



export const ShellSectionComponent = ({ questionId }: { questionId: string}) => {
  return (
    <div className={`p-2 w-[calc(58vw)]`}>
      <EZXTerminal questionId={questionId} />
    </div>
  );
}
