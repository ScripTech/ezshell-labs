import EZXTerminal from "./terminal";



export const ShellSectionComponent = ({ questionId }: { questionId: string}) => {
  return (
    <div className={`p-2 w-[calc(55vw)]`}>
      <EZXTerminal questionId={questionId} />
    </div>
  );
}
