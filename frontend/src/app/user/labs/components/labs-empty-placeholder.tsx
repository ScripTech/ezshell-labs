import { Button } from "@/components/ui/button"
import { TerminalIcon } from "lucide-react"

interface LabsEmptyPlaceholderProps {
  title?: string
  description?: string
  iconName?: string
  action?: React.ReactNode
}

export const LabsEmptyPlaceholder = ({ description, title, action }: LabsEmptyPlaceholderProps) => {

  return (
    <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <TerminalIcon/>
        <h3 className="mt-4 text-lg font-semibold">{title ?? "No lab enroled or Lab not found"}</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          {description ?? "You have not enroled to any lab."}
        </p>
        {action}
      </div>
    </div>
  )
}
