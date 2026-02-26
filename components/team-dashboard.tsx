"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getTickets } from "@/lib/storage"
import { useEffect, useState } from "react"
import type { Ticket } from "@/lib/types"
import { 
  AlertCircle, Clock, CheckCircle2, TrendingUp, Users, 
  AlertTriangle, FileText, Lightbulb, XCircle, Eye
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// 팀원 목록 (목업)
const TEAM_MEMBERS = [
  { id: "user-1", name: "김철수", processes: ["HCR", "VGOFCC"], role: "엔지니어" },
  { id: "user-2", name: "박영희", processes: ["1CDU", "2CDU", "1VDU"], role: "엔지니어" },
  { id: "user-3", name: "최진우", processes: ["RFCC", "VRHR"], role: "엔지니어" },
  { id: "user-4", name: "한미영", processes: ["1KD", "2KD", "3KD", "4KD"], role: "엔지니어" },
  { id: "user-5", name: "송재현", processes: ["VBU", "RHDS", "VGHDS", "SRU"], role: "엔지니어" },
]

// 팀원별 티켓 할당 (목업)
const TICKET_OWNER_MAP: Record<string, string> = {
  "EVT-001": "김철수",
  "EVT-002": "박영희", 
  "EVT-003": "최진우",
  "EVT-004": "한미영",
  "EVT-005": "송재현",
  "EVT-006": "김철수",
  "EVT-007": "박영희",
  "EVT-008": "최진우",
  "EVT-009": "김철수",
  "EVT-010": "송재현",
}

// 팀원별 모니터링 현황 (목업)
const MONITORING_STATUS: Record<string, { 
  completed: boolean 
  lastCheck: string 
  processesChecked: number 
  totalProcesses: number 
  issues: number 
}> = {
  "김철수": { completed: true, lastCheck: "2026-02-27 08:45", processesChecked: 2, totalProcesses: 2, issues: 0 },
  "박영희": { completed: false, lastCheck: "2026-02-27 07:30", processesChecked: 1, totalProcesses: 3, issues: 1 },
  "최진우": { completed: true, lastCheck: "2026-02-27 09:00", processesChecked: 2, totalProcesses: 2, issues: 2 },
  "한미영": { completed: true, lastCheck: "2026-02-27 08:20", processesChecked: 4, totalProcesses: 4, issues: 0 },
  "송재현": { completed: false, lastCheck: "2026-02-26 17:00", processesChecked: 2, totalProcesses: 4, issues: 0 },
}

// 팀원별 자산화 현황 (목업) - 지식, SOP, 교훈 등록
const ASSET_STATUS: Record<string, {
  knowledgeDocs: number
  sopUpdates: number
  lessonsLearned: number
  weeklyTarget: number
}> = {
  "김철수": { knowledgeDocs: 3, sopUpdates: 1, lessonsLearned: 2, weeklyTarget: 5 },
  "박영희": { knowledgeDocs: 2, sopUpdates: 2, lessonsLearned: 1, weeklyTarget: 5 },
  "최진우": { knowledgeDocs: 1, sopUpdates: 0, lessonsLearned: 1, weeklyTarget: 5 },
  "한미영": { knowledgeDocs: 4, sopUpdates: 2, lessonsLearned: 3, weeklyTarget: 5 },
  "송재현": { knowledgeDocs: 2, sopUpdates: 1, lessonsLearned: 0, weeklyTarget: 5 },
}

export function TeamDashboard() {
  const [allTickets, setAllTickets] = useState<Ticket[]>([])

  useEffect(() => {
    setAllTickets(getTickets())
  }, [])

  // 팀원별 티켓 현황 계산
  const memberTicketStats = TEAM_MEMBERS.map(member => {
    const memberTickets = allTickets.filter(t => TICKET_OWNER_MAP[t.id] === member.name)
    const openTickets = memberTickets.filter(t => t.status === "Open" || t.status === "In Progress")
    const blockedTickets = memberTickets.filter(t => t.status === "Blocked")
    const p1Tickets = memberTickets.filter(t => t.priority === "P1" && t.status !== "Closed")
    const overdueTickets = memberTickets.filter(t => {
      const dueDate = new Date(t.dueDate)
      return dueDate < new Date() && t.status !== "Closed"
    })
    
    return {
      ...member,
      totalTickets: memberTickets.length,
      openTickets: openTickets.length,
      blockedTickets: blockedTickets.length,
      p1Tickets: p1Tickets.length,
      overdueTickets: overdueTickets.length,
      monitoring: MONITORING_STATUS[member.name],
      assets: ASSET_STATUS[member.name],
    }
  })

  // 전체 요약 통계
  const totalStats = {
    totalTickets: allTickets.length,
    openTickets: allTickets.filter(t => t.status === "Open").length,
    inProgress: allTickets.filter(t => t.status === "In Progress").length,
    blocked: allTickets.filter(t => t.status === "Blocked").length,
    closed: allTickets.filter(t => t.status === "Closed").length,
  }

  const monitoringComplete = memberTicketStats.filter(m => m.monitoring?.completed).length
  const totalMembers = TEAM_MEMBERS.length

  return (
    <div className="space-y-6">
      {/* 팀 전체 요약 */}
      <div className="grid grid-cols-6 gap-4">
        <Card className="col-span-1 bg-primary text-primary-foreground">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-xs opacity-80">팀원</p>
                <p className="text-2xl font-bold">{totalMembers}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">전체 이벤트</p>
            <p className="text-2xl font-bold">{totalStats.totalTickets}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">진행 중</p>
            <p className="text-2xl font-bold text-amber-600">{totalStats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">차단됨</p>
            <p className="text-2xl font-bold text-red-600">{totalStats.blocked}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">완료</p>
            <p className="text-2xl font-bold text-green-600">{totalStats.closed}</p>
          </CardContent>
        </Card>
        <Card className={cn(monitoringComplete === totalMembers ? "border-green-200" : "border-amber-200")}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">오늘 모니터링</p>
            <p className="text-2xl font-bold">
              <span className={monitoringComplete === totalMembers ? "text-green-600" : "text-amber-600"}>
                {monitoringComplete}
              </span>
              <span className="text-muted-foreground text-lg">/{totalMembers}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 팀원별 모니터링 완료 여부 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            팀원별 모니터링 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {memberTicketStats.map(member => (
              <Card 
                key={member.id} 
                className={cn(
                  "p-4",
                  member.monitoring?.completed 
                    ? "border-green-200 bg-green-50/30" 
                    : "border-amber-200 bg-amber-50/30"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{member.name}</span>
                  {member.monitoring?.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>점검 현황</span>
                    <span className="font-medium text-foreground">
                      {member.monitoring?.processesChecked}/{member.monitoring?.totalProcesses} 공정
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>마지막 점검</span>
                    <span>{member.monitoring?.lastCheck.split(" ")[1]}</span>
                  </div>
                  {member.monitoring && member.monitoring.issues > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>이슈 {member.monitoring.issues}건 발견</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 팀원별 티켓 병목 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            팀원별 이벤트 병목 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">팀원</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">담당 공정</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">진행 중</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">차단됨</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">P1 이벤트</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">기한 초과</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                </tr>
              </thead>
              <tbody>
                {memberTicketStats.map(member => {
                  const hasIssue = member.blockedTickets > 0 || member.p1Tickets > 0 || member.overdueTickets > 0
                  return (
                    <tr 
                      key={member.id} 
                      className={cn(
                        "border-b hover:bg-muted/30 transition-colors",
                        member.blockedTickets > 0 && "bg-red-50/50",
                        member.overdueTickets > 0 && !member.blockedTickets && "bg-amber-50/50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {member.processes.map(p => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="font-medium">{member.openTickets}</span>
                      </td>
                      <td className="text-center px-4 py-3">
                        {member.blockedTickets > 0 ? (
                          <Badge variant="destructive">{member.blockedTickets}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {member.p1Tickets > 0 ? (
                          <Badge className="bg-red-500">{member.p1Tickets}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {member.overdueTickets > 0 ? (
                          <Badge className="bg-amber-500">{member.overdueTickets}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3">
                        {hasIssue ? (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            <XCircle className="h-3 w-3 mr-1" />
                            주의 필요
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            정상
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 팀원별 자산화 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            팀원별 자산화 현황 (이번 주)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {memberTicketStats.map(member => {
              const assets = member.assets
              const totalAssets = assets ? assets.knowledgeDocs + assets.sopUpdates + assets.lessonsLearned : 0
              const targetProgress = assets ? (totalAssets / assets.weeklyTarget) * 100 : 0
              
              return (
                <Card key={member.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">{member.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {totalAssets}/{assets?.weeklyTarget || 5} 건
                    </span>
                  </div>
                  <Progress value={Math.min(targetProgress, 100)} className="h-2 mb-3" />
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        지식 문서
                      </span>
                      <span className="font-medium">{assets?.knowledgeDocs || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        SOP 업데이트
                      </span>
                      <span className="font-medium">{assets?.sopUpdates || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Lightbulb className="h-3 w-3" />
                        Lessons Learned
                      </span>
                      <span className="font-medium">{assets?.lessonsLearned || 0}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 최근 이벤트 목록 (간소화) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            최근 활성 이벤트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allTickets
              .filter(t => t.status !== "Closed")
              .slice(0, 5)
              .map((ticket) => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Badge className={cn(
                      "text-xs",
                      ticket.priority === "P1" && "bg-red-500",
                      ticket.priority === "P2" && "bg-amber-500",
                      ticket.priority === "P3" && "bg-blue-500",
                      ticket.priority === "P4" && "bg-gray-400"
                    )}>
                      {ticket.priority}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        담당: {TICKET_OWNER_MAP[ticket.id] || ticket.owner} | 마감: {ticket.dueDate}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    ticket.status === "Blocked" && "text-red-600 border-red-300",
                    ticket.status === "In Progress" && "text-amber-600 border-amber-300",
                    ticket.status === "Open" && "text-blue-600 border-blue-300"
                  )}>
                    {ticket.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
