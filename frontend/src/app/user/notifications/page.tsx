import { Bell } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="mx-full py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
      </div>
      <div className="min-w-fit bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-600/50 p-8 shadow-sm">
        <p className="text-slate-600 dark:text-slate-400">
          You have no notifications at this time.
        </p>
        {/* Future: List notifications here */}
      </div>
    </div>
  )
}
