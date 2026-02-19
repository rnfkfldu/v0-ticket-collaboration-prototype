"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Ticket } from "@/lib/types"
import { getTickets } from "@/lib/storage"
import { Link2, Search, FileText } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SimilarTicketsPanelProps {
  ticket: Ticket
}

export function SimilarTicketsPanel({ ticket }: SimilarTicketsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Find tickets with same unit or matching tags
  const allTickets = getTickets()
  const relatedTickets = allTickets
    .filter((t) => {
      if (t.id === ticket.id) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.unit?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
        )
      }

      // Same unit
      if (t.unit === ticket.unit) return true

      // Matching tags
      if (ticket.tags && t.tags) {
        const hasMatchingTag = ticket.tags.some((tag) => t.tags?.includes(tag))
        if (hasMatchingTag) return true
      }

      return false
    })
    .slice(0, 5)

  // Calculate similarity score
  const getSimilarityScore = (t: Ticket) => {
    let score = 0

    // Same unit
    if (t.unit === ticket.unit) score += 40

    // Matching tags
    if (ticket.tags && t.tags) {
      const matchingTags = ticket.tags.filter((tag) => t.tags?.includes(tag))
      score += matchingTags.length * 20
    }

    // Same ticket type
    if (t.ticketType === ticket.ticketType) score += 15

    // Same impact
    if (t.impact === ticket.impact) score += 15

    return Math.min(score, 100)
  }

  const getSimilarityReason = (t: Ticket) => {
    const reasons = []

    if (t.unit === ticket.unit) reasons.push(`Same unit (${t.unit})`)

    if (ticket.tags && t.tags) {
      const matchingTags = ticket.tags.filter((tag) => t.tags?.includes(tag))
      if (matchingTags.length > 0) {
        reasons.push(`Matching tags: ${matchingTags.join(", ")}`)
      }
    }

    if (t.ticketType === ticket.ticketType) reasons.push(`Same type (${t.ticketType})`)

    return reasons.join(" • ")
  }

  const relatedReports = [
    {
      id: "R1",
      title: `${ticket.context?.unit} 공정 성능 분석 보고서`,
      date: "2025-12-15",
      author: "김철수",
      summary: "최근 3개월간 공정 성능 데이터 분석 및 개선 방안 제시",
    },
    {
      id: "R2",
      title: `${ticket.context?.unit} 에너지 효율 개선 보고서`,
      date: "2025-11-20",
      author: "박영희",
      summary: "에너지 소비 패턴 분석 및 절감 방안",
    },
    {
      id: "R3",
      title: "정기 안전 점검 보고서",
      date: "2025-10-30",
      author: "이민준",
      summary: "정기 안전 점검 결과 및 조치 사항",
    },
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">관련 이벤트 및 레포트</h3>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">관련 이벤트</TabsTrigger>
          <TabsTrigger value="reports">관련 레포트</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4 mt-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Unit, 태그 또는 키워드로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Similar tickets list */}
          {relatedTickets.length > 0 ? (
            <div className="space-y-3">
              {relatedTickets.map((t) => {
                const score = getSimilarityScore(t)
                const reason = getSimilarityReason(t)

                return (
                  <Link key={t.id} href={`/tickets/${t.id}`}>
                    <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium text-foreground line-clamp-1">{t.title}</h4>
                        <Badge variant="secondary" className="shrink-0">
                          {score}% 유사
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{t.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {t.unit}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {t.status}
                        </Badge>
                        {t.closedDate && (
                          <Badge variant="secondary" className="text-xs">
                            완료됨
                          </Badge>
                        )}
                      </div>
                      {reason && <p className="text-xs text-muted-foreground mt-2 italic">{reason}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{searchQuery ? "검색 결과가 없습니다" : "관련 이벤트을 찾을 수 없습니다"}</p>
            </div>
          )}

          {/* View all by unit/tag */}
          {ticket.unit && !searchQuery && (
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setSearchQuery(ticket.unit || "")}
            >
              모든 {ticket.unit} 이벤트 보기
            </Button>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-3 mt-4">
          {relatedReports.map((report) => (
            <div key={report.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">{report.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{report.summary}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{report.author}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{report.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
