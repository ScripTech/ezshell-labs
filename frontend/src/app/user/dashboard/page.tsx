"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { FaLinux } from "react-icons/fa"
import { FcAutomatic } from "react-icons/fc"

  // let's update <span>⚛️</span> with lucide icons
const user = {
  skills: [
    { name: "Linux", level: "Beginner", icon: <FaLinux />, progress: 1 },
    { name: "Ansible", level: "Beginner", icon: <FcAutomatic />, progress: 1 },
    { name: "Scripting", level: "Beginner", icon: <span>☁️</span>, progress: 1 },
    { name: "Platform Engineer", level: "Beginner", icon: <span>👨🏽‍💻</span>, progress: 1 },
    { name: "Kubernetes", level: "Beginner", icon: <span>⛴️</span>, progress: 1 },
  ],
}

export default function UserDashboardPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [showCompletedOnly, setShowCompletedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [labFilter, setLabFilter] = useState("")
  const pageSize = 30

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true)
      const res = await fetch("/api/user/enrolled-tasks")
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    fetchTasks()
  }, [])

  // Get unique lab names for filter dropdown (limit to 15)
  const allLabs = Array.from(new Set(tasks.map(task => task.lab).filter(Boolean))).slice(0, 15)

  const filteredTasks = tasks.filter(task =>
    (task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.lab?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase())) &&
    (!showCompletedOnly || task.completed) &&
    (!labFilter || task.lab === labFilter)
  )

  const totalPages = Math.ceil(filteredTasks.length / pageSize)
  const paginatedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="flex flex-col gap-4 py-8 w-full px-8 mx-auto">
      <div className="flex flex-row md:flex-row gap-4 mb-6">
        <Card className="border-none space-y-3 min-w-[260px]">
          <CardHeader className="p-4">
            <CardTitle>
              <div className="text-lg">{session?.user?.name ?? "Anonymous"}</div>
              <div className="text-sm text-muted-foreground">{session?.user?.email ?? "Anonymous"}</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="bg-green-500/70 text-primary rounded px-4 py-2 text-center font-bold text-xl mb-2">
              TOTAL POINTS
              <div className="text-3xl mt-2">
                {tasks.reduce((acc, t) => {
                  const score = parseInt(String(t.score ?? 0), 10) || 0;
                  return acc + score;
                }, 0).toLocaleString()}
              </div>
            </div>
            <div className="text-muted-foreground text-center py-2 border-t">
              COMPLETED
              <div className="text-xl mt-1">{tasks.filter(t => t.completed).length}</div>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 rounded-lg shadow flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.skills.map((skill, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {skill.name} {skill.icon}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground mb-2">{skill.level}</div>
                    <div className="flex gap-1">
                      {[...Array(6.0)].map((_, idx) => (
                        <span key={idx} className={`w-3 h-3 rounded-full ${idx < skill.progress ? "bg-blue-500" : "bg-gray-200"}`}></span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>

      </div>
      <div className="flex flex-col gap-6">
        <div className="flex-1 flex items-end gap-2">
          <Input
            placeholder="Search challenges..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant={showCompletedOnly ? "default" : "outline"}
            onClick={() => setShowCompletedOnly(v => !v)}
            className="ml-2"
          >
            {showCompletedOnly ? "Show All" : "Show Completed"}
          </Button>
          <Select
            value={labFilter}
            onValueChange={value => {
              setLabFilter(value === "all" ? "" : value)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Lab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Labs</SelectItem>
              {allLabs.map(lab => (
                <SelectItem key={lab} value={lab}>
                  <span className="uppercase">{lab}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded shadow">
          <DataTable columns={columns} data={paginatedTasks} isLoading={loading} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div>
          Page {page} of {totalPages || 1} &mdash; Showing {paginatedTasks.length} out of {filteredTasks.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
