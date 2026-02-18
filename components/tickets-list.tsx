"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import Link from "next/link"
import { getTickets, deleteTicket } from "@/lib/storage"
import { AlertCircle, Lock, Users, Globe, Search, Trash2, Eye, Edit } from "lucide-react"
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
import { TicketEditDialog } from "@/components/ticket-edit-dialog"
import type { Ticket } from "@/lib/types"

const CURRENT_USER = "김지수" // 현재 사용자 (실제로는 인증 시스템에서 가져와야 함)

export function TicketsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null)
  const [editTicket, setEditTicket] = useState<Ticket | null>(null)
  const router = useRouter()

  useEffect(() => {
    setTickets(getTickets())
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const handleFocus = () => {
      setTickets(getTickets())
    }

    window.addEventListener("focus", handleFocus)

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tickets") {
        setTickets(getTickets())
      }
    }

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

  const handleEditSuccess = () => {
    setTickets(getTickets())
  }

  const assignedTickets = tickets.filter((t) => t.status !== "Closed")
  const closedTickets = tickets.filter((t) => t.status === "Closed")

  const getTicketTypeLabel = (type: string) => {
    switch (type) {
      case "Improvement": return "개선"
      case "Trouble": return "트러블"
      case "Change": return "변경"
      case "Analysis": return "분석"
      case "Request": return "요청"
      case "ModelImprovement": return "모델개선"
      case "ProcessTest": return "실공정테스트"
      default: return type
    }
  }

  const getTicketTypeColor = (type: string) => {
    switch (type) {
      case "Improvement": return "bg-blue-100 text-blue-700"
      case "Trouble": return "bg-orange-100 text-orange-700"
      case "Change": return "bg-amber-100 text-amber-700"
      case "Analysis": return "bg-emerald-100 text-emerald-700"
      case "Request": return "bg-sky-100 text-sky-700"
      case "ModelImprovement": return "bg-violet-100 text-violet-700"
      case "ProcessTest": return "bg-teal-100 text-teal-700"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const filterTickets = (ticketsList: typeof tickets) => {
    return ticketsList.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false
      if (categoryFilter !== "all" && ticket.ticketType !== categoryFilter) return false
      if (
        searchQuery &&
        !ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.owner.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }

  const filteredAssignedTickets = filterTickets(assignedTickets)
  const filteredClosedTickets = filterTickets(closedTickets)

  const blockedCount = assignedTickets.filter((t) => t.status === "Blocked").length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P1":
        return "bg-status-execution text-status-execution-foreground"
      case "P2":
        return "bg-status-decision text-status-decision-foreground"
      case "P3":
        return "bg-muted text-muted-foreground"
      case "P4":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-status-analysis text-status-analysis-foreground"
      case "In Progress":
        return "bg-status-decision text-status-decision-foreground"
      case "Blocked":
        return "bg-status-execution text-status-execution-foreground"
      case "Closed":
        return "bg-status-validation text-status-validation-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getAccessIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case "Private":
        return <Lock className="h-3 w-3" />
      case "Team":
        return <Users className="h-3 w-3" />
      case "Public":
        return <Globe className="h-3 w-3" />
      default:
        return null
    }
  }

  const TicketsTable = ({ ticketsList }: { ticketsList: typeof tickets }) => {
    const calculateDelay = (ticket: Ticket) => {
      const dueDate = new Date(ticket.dueDate)
      const today = new Date()
      const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays > 0) {
        return { delayed: true, days: diffDays }
      }
      return { delayed: false, days: 0 }
    }

    return (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  제목
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  분류
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  담당자
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  우선순위
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  상태
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  딜레이
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  현재 병목
                </th>
                <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ticketsList.map((ticket) => {
                const delay = calculateDelay(ticket)
                return (
                  <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-foreground hover:text-primary font-medium text-sm"
                      >
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={`text-xs ${getTicketTypeColor(ticket.ticketType)}`}>
                        {getTicketTypeLabel(ticket.ticketType)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.owner}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {delay.delayed ? (
                        <Badge variant="destructive" className="text-xs">
                          +{delay.days}일
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ticket.bottleneck || "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="보기">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        {ticket.status !== "Closed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="수정"
                            onClick={(e) => {
                              e.preventDefault()
                              setEditTicket(ticket)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="삭제"
                          onClick={(e) => {
                            e.preventDefault()
                            setDeleteTicketId(ticket.id)
                          }}
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
      <Card className="p-6 bg-card-highlight border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <AlertCircle className="h-4 w-4" />
          <span>시스템 현황</span>
        </div>
        <p className="text-foreground">
          <span className="font-semibold">
            {assignedTickets.length}개의 오픈 티켓 중 {blockedCount}개
          </span>{" "}
          가 차단 상태입니다
        </p>
      </Card>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="제목, 설명 또는 담당자로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">상태:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="Open">진행 대기</SelectItem>
              <SelectItem value="In Progress">진행 중</SelectItem>
              <SelectItem value="Blocked">차단됨</SelectItem>
              <SelectItem value="Closed">완료</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">우선순위:</span>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 우선순위</SelectItem>
              <SelectItem value="P1">P1</SelectItem>
              <SelectItem value="P2">P2</SelectItem>
              <SelectItem value="P3">P3</SelectItem>
              <SelectItem value="P4">P4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">분류:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 분류</SelectItem>
              <SelectItem value="Improvement">개선</SelectItem>
              <SelectItem value="Trouble">트러블</SelectItem>
              <SelectItem value="Change">변경</SelectItem>
              <SelectItem value="Analysis">분석</SelectItem>
              <SelectItem value="ModelImprovement">모델개선</SelectItem>
              <SelectItem value="ProcessTest">실공정테스트</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="assigned" className="w-full">
        <TabsList>
          <TabsTrigger value="assigned">나에게 할당된 티켓 ({filteredAssignedTickets.length})</TabsTrigger>
          <TabsTrigger value="closed">완료된 티켓 ({filteredClosedTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {assignedTickets.length}개 중 {filteredAssignedTickets.length}개의 오픈 티켓 표시
          </div>
          <TicketsTable ticketsList={filteredAssignedTickets} />
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {closedTickets.length}개 중 {filteredClosedTickets.length}개의 완료된 티켓 표시
          </div>
          <TicketsTable ticketsList={filteredClosedTickets} />
        </TabsContent>
      </Tabs>

      {editTicket && (
        <TicketEditDialog
          ticket={editTicket}
          open={!!editTicket}
          onOpenChange={(open) => !open && setEditTicket(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      <AlertDialog open={deleteTicketId !== null} onOpenChange={() => setDeleteTicketId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>티켓 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 티켓을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니���.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTicketId && handleDeleteTicket(deleteTicketId)}
              className="bg-destructive text-destructive-foreground"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
