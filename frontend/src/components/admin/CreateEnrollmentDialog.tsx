"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { User, Lab } from "@/types/enrollment-management"
import { toast } from "sonner"

interface CreateEnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  labs: Lab[]
  onSubmit: (userId: string, labId: string) => Promise<void>
}

export function CreateEnrollmentDialog({
  open,
  onOpenChange,
  users,
  labs,
  onSubmit
}: CreateEnrollmentDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedLabId, setSelectedLabId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedLabId) {
      toast.error("Please select both a user and a lab")
      return
    }

    setLoading(true)
    try {
      await onSubmit(selectedUserId, selectedLabId)
      // Reset form
      setSelectedUserId("")
      setSelectedLabId("")
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setSelectedUserId("")
      setSelectedLabId("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enroll User in Lab</DialogTitle>
          <DialogDescription>
            Select a user and lab to create a new enrollment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="user">User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>{user.name || user.email}</span>
                      {user.name && (
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lab">Lab</Label>
            <Select value={selectedLabId} onValueChange={setSelectedLabId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lab" />
              </SelectTrigger>
              <SelectContent>
                {labs.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    <div className="flex flex-col">
                      <span>{lab.name}</span>
                      {lab.description && (
                        <span className="text-xs text-muted-foreground">
                          {lab.description.substring(0, 50)}
                          {lab.description.length > 50 ? "..." : ""}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId || !selectedLabId || loading}
          >
            {loading ? "Enrolling..." : "Enroll User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
