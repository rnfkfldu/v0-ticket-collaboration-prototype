"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTickets } from "@/lib/storage"
import { useEffect, useState } from "react"
import type { Ticket } from "@/lib/types"
import { AlertCircle, Clock, CheckCircle2, XCircle, TrendingUp } from "lucide-react"
import Link from "next/link"

export function TeamDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => {
    setTickets(getTickets())
  }, [])

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    blocked: tickets.filter((t) => t.status === "Blocked").length,
    closed: tickets.filter((t) => t.status === "Closed").length,
  }

  const priorityStats = {
    p1: tickets.filter((t) => t.priority === "P1").length,
    p2: tickets.filter((t) => t.priority === "P2").length,
    p3: tickets.filter((t) => t.priority === "P3").length,
    p4: tickets.filter((t) => t.priority === "P4").length,
  }

  const bottlenecksByType = tickets.reduce(
    (acc, ticket) => {
      ticket.workPackages.forEach((wp) => {
        if (wp.status === "Blocked") {
          acc[wp.wpType] = (acc[wp.wpType] || 0) + 1
        }
      })
      return acc
    },
    {} as Record<string, number>,
  )

  const bottlenecksByTeam = tickets.reduce(
    (acc, ticket) => {
      ticket.workPackages.forEach((wp) => {
        if (wp.status === "Blocked") {
          acc[wp.ownerTeam] = (acc[wp.ownerTeam] || 0) + 1
        }
      })
      return acc
    },
    {} as Record<string, number>,
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "In Progress":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "Blocked":
        return "text-red-600 bg-red-50 border-red-200"
      case "Closed":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P1":
        return "bg-red-500"
      case "P2":
        return "bg-amber-500"
      case "P3":
        return "bg-blue-500"
      case "P4":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 border-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">전체 이벤트</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">진행 대기</p>
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
            </div>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">진행 중</p>
              <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">차단됨</p>
              <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
            </div>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">완료</p>
              <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">우선순위 분포</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${getPriorityColor("P1")}`} />
                <span className="text-sm text-foreground">P1 - 긴급</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{priorityStats.p1}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${getPriorityColor("P2")}`} />
                <span className="text-sm text-foreground">P2 - 높음</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{priorityStats.p2}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${getPriorityColor("P3")}`} />
                <span className="text-sm text-foreground">P3 - 보통</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{priorityStats.p3}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${getPriorityColor("P4")}`} />
                <span className="text-sm text-foreground">P4 - 낮음</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{priorityStats.p4}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">단계별 병목</h3>
          <div className="space-y-3">
            {Object.entries(bottlenecksByType).length > 0 ? (
              Object.entries(bottlenecksByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-foreground">{type}</span>
                  </div>
                  <Badge variant="destructive" className="rounded-full">
                    {count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">병목이 감지되지 않았습니다</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">팀별 병목</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(bottlenecksByTeam).length > 0 ? (
            Object.entries(bottlenecksByTeam).map(([team, count]) => (
              <Card key={team} className="p-4 border-red-200 bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{team}</p>
                    <p className="text-xs text-muted-foreground">차단된 워크 패키지</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white font-bold">{count}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">모든 팀 정상 진행 중</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">전체 이벤트</h3>
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      <Badge variant="outline">{ticket.ticketType}</Badge>
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{ticket.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>담당자: {ticket.owner}</span>
                      <span>마감일: {ticket.dueDate}</span>
                      <span>WP: {ticket.workPackages.length}</span>
                    </div>
                    {ticket.bottleneck && (
                      <div className="mt-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">{ticket.bottleneck}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
