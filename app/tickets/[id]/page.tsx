"use client"

import { TicketDetail } from "@/components/ticket-detail"
import { QuickInquiryDetail } from "@/components/quick-inquiry-detail"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getTicketById } from "@/lib/storage"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { Ticket } from "@/lib/types"

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const found = getTicketById(id)
    setTicket(found || null)
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/actions/tickets">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                이벤트 목록
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-foreground">이벤트를 찾을 수 없음</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">
            이벤트 #{id}을(를) 찾을 수 없습니다.
          </p>
          <Button onClick={() => router.push("/actions/tickets")}>
            이벤트 목록으로 돌아가기
          </Button>
        </main>
      </div>
    )
  }

  // 빠른 문의는 별도 채팅 스타일 UI 사용
  if (ticket.ticketType === "QuickInquiry") {
    return <QuickInquiryDetail ticket={ticket} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/actions/tickets">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              이벤트 목록
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">이벤트 상세</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <TicketDetail ticket={ticket} />
      </main>
    </div>
  )
}
