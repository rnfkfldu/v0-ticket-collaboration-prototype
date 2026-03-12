"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import Link from "next/link"
import { getTickets, deleteTicket } from "@/lib/storage"
import { Search, Trash2, Eye, Clock, ArrowRight, AlertTriangle, CheckCircle, XCircle, FileSearch, PauseCircle, Users, LayoutGrid, List } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Ticket } from "@/lib/types"
import { useUser } from "@/lib/user-context"
import { cn } from "@/lib/utils"

const CURRENT_USER = "김지수"

// 팀장용: 티켓별 담당자 매핑 (목업)
const TICKET_ASSIGNEES: Record<string, { name: string; team: string }> = {
  "EVT-001": { name: "김철수", team: "생산팀" },
  "EVT-002": { name: "박영희", team: "생산팀" },
  "EVT-003": { name: "최진우", team: "생산팀" },
  "EVT-004": { name: "한미영", team: "생산팀" },
  "EVT-005": { name: "송재현", team: "생산팀" },
  "EVT-006": { name: "김철수", team: "생산팀" },
  "EVT-007": { name: "박영희", team: "생산팀" },
  "EVT-008": { name: "최진우", team: "생산팀" },
  "EVT-009": { name: "한미영", team: "생산팀" },
  "EVT-010": { name: "송재현", team: "생산팀" },
}

const PROCESS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  issued: { label: "이벤트 발행", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  accepted: { label: "접수", color: "bg-sky-100 text-sky-700 border-sky-200", icon: ArrowRight },
  "verbal-closed": { label: "구두종결", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle },
  review: { label: "기술검토", color: "bg-amber-100 text-amber-800 border-amber-200", icon: FileSearch },
  "additional-review": { label: "추가검토", color: "bg-orange-100 text-orange-700 border-orange-200", icon: FileSearch },
  "review-complete": { label: "검토완료", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  closed: { label: "종결", color: "bg-gray-100 text-gray-600 border-gray-200", icon: CheckCircle },
  hold: { label: "보류", color: "bg-slate-100 text-slate-600 border-slate-200", icon: PauseCircle },
}

const TICKET_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  Improvement: { label: "개선", color: "bg-blue-50 text-blue-700" },
  Trouble: { label: "트러블", color: "bg-orange-50 text-orange-700" },
  Change: { label: "변경", color: "bg-amber-50 text-amber-700" },
  Analysis: { label: "분석", color: "bg-emerald-50 text-emerald-700" },
  Request: { label: "요청", color: "bg-sky-50 text-sky-700" },
  ModelImprovement: { label: "모델개선", color: "bg-indigo-50 text-indigo-700" },
  ProcessTest: { label: "실공정테스트", color: "bg-teal-50 text-teal-700" },
  QuickInquiry: { label: "빠른문의", color: "bg-amber-100 text-amber-700" },
}

export function TicketsList() {
  const { currentUser } = useUser()
  const isTeamLead = currentUser.role === "team-lead" || currentUser.role === "division-head" || currentUser.role === "plant-head"
  
  const [processStatusFilter, setProcessStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "grouped">(isTeamLead ? "grouped" : "list")
  const router = useRouter()

  useEffect(() => {
    setTickets(getTickets())
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const handleFocus = () => setTickets(getTickets())
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tickets") setTickets(getTickets())
    }
    window.addEventListener("focus", handleFocus)
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const handleDeleteTicket = (ticketId: string) => {
    deleteTicket(ticketId)
    setTickets(getTickets())
    setDeleteTicketId(null)
  }

  // Status-based grouping
  const pendingAcceptance = tickets.filter(t => t.processStatus === "issued")
  const inReview = tickets.filter(t => t.processStatus === "review" || t.processStatus === "additional-review" || t.processStatus === "accepted")
  const reviewComplete = tickets.filter(t => t.processStatus === "review-complete")
  const verbalClosed = tickets.filter(t => t.processStatus === "verbal-closed")
  const closed = tickets.filter(t => t.processStatus === "closed")

  const filterTickets = (ticketsList: Ticket[]) => {
    return ticketsList.filter((ticket) => {
      // QuickInquiry는 processStatus 필터 무시 (processStatus가 없음)
      if (processStatusFilter !== "all" && ticket.ticketType !== "QuickInquiry" && ticket.processStatus !== processStatusFilter) return false
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false
      if (categoryFilter !== "all" && ticket.ticketType !== categoryFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !ticket.title.toLowerCase().includes(q) &&
          !ticket.description.toLowerCase().includes(q) &&
          !ticket.id.toLowerCase().includes(q) &&
          !(ticket.unit || "").toLowerCase().includes(q) &&
          !(ticket.equipment || "").toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }

  // 팀장: 중요 이벤트만 (P1, P2) 필터링
  const importantTickets = isTeamLead 
    ? tickets.filter(t => t.priority === "P1" || t.priority === "P2")
    : tickets
    
  // QuickInquiry는 processStatus가 없으므로 status로 분류, 나머지는 processStatus로 분류
  const activeTickets = importantTickets.filter(t => {
    if (t.ticketType === "QuickInquiry") {
      return t.status !== "Closed"
    }
    return t.processStatus !== "closed" && t.processStatus !== "verbal-closed"
  })
  const inactiveTickets = importantTickets.filter(t => {
    if (t.ticketType === "QuickInquiry") {
      return t.status === "Closed"
    }
    return t.processStatus === "closed" || t.processStatus === "verbal-closed"
  })
  const filteredActive = filterTickets(activeTickets)
  const filteredInactive = filterTickets(inactiveTickets)
  
  // 팀장용 담당자별 그룹핑
  const ticketsByAssignee: Record<string, Ticket[]> = {}
  if (isTeamLead) {
    filteredActive.forEach(ticket => {
      const assignee = TICKET_ASSIGNEES[ticket.id]?.name || "미배정"
      if (!ticketsByAssignee[assignee]) ticketsByAssignee[assignee] = []
      ticketsByAssignee[assignee].push(ticket)
    })
  }

  const getProcessStatusBadge = (status: string | undefined) => {
    const config = PROCESS_STATUS_CONFIG[status || "issued"] || PROCESS_STATUS_CONFIG.issued
    return (
      <Badge variant="outline" className={`text-xs ${config.color} border`}>
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      P1: "bg-red-600 text-white",
      P2: "bg-amber-500 text-white",
      P3: "bg-slate-200 text-slate-700",
      P4: "bg-slate-100 text-slate-500",
    }
    return (
      <Badge className={`text-xs ${colors[priority] || colors.P3}`}>
        {priority}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const config = TICKET_TYPE_CONFIG[type] || { label: type, color: "bg-muted text-muted-foreground" }
    return (
      <Badge variant="secondary" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    )
  }

  const calculateDelay = (ticket: Ticket) => {
    const dueDate = new Date(ticket.dueDate)
    const today = new Date()
    const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const TicketsTable = ({ ticketsList }: { ticketsList: Ticket[] }) => {
    if (ticketsList.length === 0) {
      return (
        <Card className="p-12">
          <p className="text-center text-muted-foreground text-sm">해당 조건의 이벤트가 없습니다.</p>
        </Card>
      )
    }

    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">제목</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">유형</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">Unit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">우선순위</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">프로세스</th>
                {isTeamLead && <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">담당자</th>}
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">요청자</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">생성일</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">지연</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ticketsList.map((ticket) => {
                const delay = calculateDelay(ticket)
                const assignee = TICKET_ASSIGNEES[ticket.id]
                return (
                  <tr key={ticket.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground">{ticket.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getTypeBadge(ticket.ticketType)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-foreground">{ticket.unit || "-"}</span>
                    </td>
                    <td className="px-4 py-3">{getPriorityBadge(ticket.priority)}</td>
                    <td className="px-4 py-3">{getProcessStatusBadge(ticket.processStatus)}</td>
                    {isTeamLead && (
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-foreground">{assignee?.name || "-"}</span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{ticket.requester}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{ticket.createdDate}</span>
                    </td>
                    <td className="px-4 py-3">
                      {delay > 0 && ticket.processStatus !== "closed" && ticket.processStatus !== "verbal-closed" ? (
                        <Badge variant="destructive" className="text-xs">+{delay}d</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="상세보기">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="삭제"
                          onClick={() => setDeleteTicketId(ticket.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  if (!isHydrated) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-card-highlight border-border">
          <div className="h-5 bg-muted rounded w-64 animate-pulse" />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">접수 대기</p>
          <p className="text-2xl font-bold text-foreground">{pendingAcceptance.length}</p>
          <p className="text-xs text-blue-600 mt-1">접수 대기 중</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">검토 중</p>
          <p className="text-2xl font-bold text-foreground">{inReview.length}</p>
          <p className="text-xs text-amber-600 mt-1">기술검토 / 추가검토</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">검토 완료</p>
          <p className="text-2xl font-bold text-foreground">{reviewComplete.length}</p>
          <p className="text-xs text-emerald-600 mt-1">종결 대기</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">구두종결</p>
          <p className="text-2xl font-bold text-foreground">{verbalClosed.length}</p>
          <p className="text-xs text-slate-600 mt-1">구두 설명 후 종결</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">종결</p>
          <p className="text-2xl font-bold text-foreground">{closed.length}</p>
          <p className="text-xs text-muted-foreground mt-1">처리 완료</p>
        </Card>
      </div>

      {/* Team Lead Header */}
      {isTeamLead && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              팀 전체 중요 이벤트 (P1, P2)
            </Badge>
            <span className="text-xs text-muted-foreground">총 {filteredActive.length}건</span>
          </div>
          <div className="flex items-center rounded border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
              title="리스트 뷰"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grouped")}
              className={cn("p-1.5 transition-colors", viewMode === "grouped" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
              title="담당자별 그룹 뷰"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ID, 제목, Unit, 장치명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={processStatusFilter} onValueChange={setProcessStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="프로세스" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="issued">이벤트 발행</SelectItem>
              <SelectItem value="accepted">접수</SelectItem>
              <SelectItem value="review">기술검토</SelectItem>
              <SelectItem value="additional-review">추가검토</SelectItem>
              <SelectItem value="review-complete">검토완료</SelectItem>
              <SelectItem value="verbal-closed">구두종결</SelectItem>
              <SelectItem value="closed">종결</SelectItem>
              <SelectItem value="hold">보류</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="우선순위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="P1">P1</SelectItem>
              <SelectItem value="P2">P2</SelectItem>
              <SelectItem value="P3">P3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="Improvement">개선</SelectItem>
              <SelectItem value="Trouble">트러블</SelectItem>
              <SelectItem value="Change">변경</SelectItem>
              <SelectItem value="Analysis">분석</SelectItem>
              <SelectItem value="QuickInquiry">빠른문의</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">진행 중 이벤트 ({filteredActive.length})</TabsTrigger>
          <TabsTrigger value="inactive">종결 이벤트 ({filteredInactive.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {!isTeamLead && pendingAcceptance.length > 0 && processStatusFilter === "all" && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{pendingAcceptance.length}건</span>의 이벤트가 접수 대기 중입니다. 확인 후 접수 처리해주세요.
              </p>
            </div>
          )}
          
          {/* 팀장 그룹 뷰 */}
          {isTeamLead && viewMode === "grouped" ? (
            <div className="space-y-4">
              {Object.entries(ticketsByAssignee).map(([assignee, assigneeTickets]) => (
                <Card key={assignee} className="overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-muted/30">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {assignee}
                      <Badge variant="outline" className="text-xs">{assigneeTickets.length}건</Badge>
                      {assigneeTickets.some(t => t.priority === "P1") && (
                        <Badge variant="destructive" className="text-xs">P1 포함</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {assigneeTickets.map(ticket => {
                        const delay = calculateDelay(ticket)
                        return (
                          <div 
                            key={ticket.id}
                            className="p-3 hover:bg-muted/30 cursor-pointer flex items-center gap-4"
                            onClick={() => router.push(`/tickets/${ticket.id}`)}
                          >
                            <span className="text-xs font-mono text-muted-foreground w-16">{ticket.id}</span>
                            {getPriorityBadge(ticket.priority)}
                            <span className="text-sm font-medium flex-1 truncate">{ticket.title}</span>
                            <span className="text-xs text-muted-foreground">{ticket.unit}</span>
                            {getProcessStatusBadge(ticket.processStatus)}
                            {delay > 0 && ticket.processStatus !== "closed" && (
                              <Badge variant="destructive" className="text-xs">+{delay}d</Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {Object.keys(ticketsByAssignee).length === 0 && (
                <Card className="p-12">
                  <p className="text-center text-muted-foreground text-sm">중요 이벤트가 없습니다.</p>
                </Card>
              )}
            </div>
          ) : (
            <TicketsTable ticketsList={filteredActive} />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4 mt-4">
          <TicketsTable ticketsList={filteredInactive} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteTicketId !== null} onOpenChange={() => setDeleteTicketId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 삭제</AlertDialogTitle>
            <AlertDialogDescription>정말 이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTicketId && handleDeleteTicket(deleteTicketId)} className="bg-destructive text-destructive-foreground">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
