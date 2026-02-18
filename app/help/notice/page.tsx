"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Pin } from "lucide-react"

const NOTICES = [
  { id: 1, title: "OOP 시스템 v2.4 업데이트 안내", date: "2025-02-01", pinned: true, category: "시스템", content: "Quality Giveaway Analysis, 분석 요청 기능이 추가되었습니다." },
  { id: 2, title: "2025년 1분기 정기 점검 일정 안내", date: "2025-01-28", pinned: true, category: "운영", content: "2025년 2월 15일(토) 00:00~06:00 시스템 정기 점검이 예정되어 있습니다." },
  { id: 3, title: "DCS 데이터 연동 지연 이슈 해결 완료", date: "2025-01-25", pinned: false, category: "시스템", content: "1/24 발생한 DCS 데이터 연동 지연 이슈가 해결되었습니다." },
  { id: 4, title: "Optimization Insight 메뉴 개편 안내", date: "2025-01-20", pinned: false, category: "기능", content: "Binding Constraint, Marginal Value, LP Vector 분석 기능이 개편되었습니다." },
  { id: 5, title: "신규 사용자 교육 일정 안내", date: "2025-01-15", pinned: false, category: "교육", content: "2025년 2월 신규 사용자 대상 OOP 시스템 교육이 진행됩니다." },
]

export default function NoticePage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">공지사항</h1>
          </div>
        </header>
        <main className="p-6 max-w-4xl space-y-3">
          {NOTICES.map(n => (
            <Card key={n.id} className={n.pinned ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-1">
                  {n.pinned && <Pin className="h-3 w-3 text-primary" />}
                  <Badge variant="outline" className="text-xs">{n.category}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{n.date}</span>
                </div>
                <h3 className="font-medium">{n.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{n.content}</p>
              </CardContent>
            </Card>
          ))}
        </main>
      </div>
    </AppShell>
  )
}
