"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useSession } from "next-auth/react"

const user = {
  username: "anonymous",
  points: 0,
  completed: 0,
  badges: [
    { label: "xl", color: "bg-blue-500", ribbon: false },
    { label: "1", color: "bg-blue-600", ribbon: true },
  ],
  completedLabs: [
    {
      name: "Ansible Automation",
      type: "automation",
      score: "9/10",
      difficulty: "medium",
      color: "bg-green-400",
    },
    {
      name: "Kubernetes Fundamentals",
      type: "cloud",
      score: "0/10",
      difficulty: "easy",
      color: "bg-blue-300",
    },
    {
      name: "Linux Networking",
      type: "networking",
      score: "0/10",
      difficulty: "medium",
      color: "bg-orange-400",
    },
    {
      name: "OpenShift Administration",
      type: "cloud",
      score: "0/10",
      difficulty: "hard",
      color: "bg-red-400",
    },
    {
      name: "RedHat Certified System Administrator",
      type: "sysadmin",
      score: "0/10",
      difficulty: "medium",
      color: "bg-orange-400",
    },
  ],
  skills: [
    { name: "Linux", level: "Beginner", icon: <span>⚛️</span>, progress: 1 },
    { name: "Ansible", level: "Advanced user", icon: <span>🗂️</span>, progress: 3 },
    { name: "Scripting", level: "Expert Guru", icon: <span>🧮</span>, progress: 4 },
  ],
}

export default function UserProfilePage() {

  const { data: session } = useSession()

  return (
    <div className="flex flex-col md:flex-row gap-6 py-8 w-full px-16 mx-auto">
      {/* Sidebar */}
      <div className="flex flex-col gap-2 p-1 min-w-[260px] space-y-2">
        <Card className="border-none space-y-3">
          <CardHeader className="p-4">
            <CardTitle className="">
              <div className="text-lg">{session?.user?.name ?? "Anonymous"}</div>
              <div className="text-sm text-muted-foreground">{session?.user?.email ?? "Anonymous"}</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="bg-green-500/70 text-white rounded px-4 py-2 text-center font-bold text-xl mb-2">
              TOTAL POINTS
              <div className="text-3xl mt-2">{user.points}</div>
            </div>
            <div className="text-muted-foreground text-center py-2 border-t">
              COMPLETED
              <div className="text-xl mt-1">{user.completed}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">BADGES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {user.badges.map((badge, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`rounded-full w-12 h-12 flex items-center justify-center text-white text-lg font-bold ${badge.color} relative`}>
                    {badge.label}
                    {badge.ribbon && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-400 text-xs px-2 py-0.5 rounded-full">🏅</span>
                    )}
                  </div>
                </div>
              ))}
              {[...Array(8)].map((_, i) => (
                <div key={i + user.badges.length} className="flex flex-col items-center">
                  <div className="rounded-full w-12 h-12 flex items-center justify-center border text-muted-foreground">...</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main */}
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  {[...Array(5.0)].map((_, idx) => (
                    <span key={idx} className={`w-3 h-3 rounded-full ${idx < skill.progress ? "bg-blue-500" : "bg-gray-200"}`}></span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mb-2 font-semibold text-lg">Completed challenges</div>
        <div className="mt-4 flex gap-4 text-sm">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span> Easy</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span> Medium</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span> Hard</span>
        </div>
        <div className="rounded shadow mt-6">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-2 px-4 text-left">Challenge</th>
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">Score</th>
              </tr>
            </thead>
            <tbody>
              {user.completedLabs.map((lab, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 px-4">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${lab.color}`}></span>
                    <span className="text-blue-600 hover:underline cursor-pointer">{lab.name}</span>
                  </td>
                  <td className="py-2 px-4">{lab.type}</td>
                  <td className="py-2 px-4">{lab.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
