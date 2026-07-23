"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Megaphone,
  LayoutDashboard,
  ChevronRight,
  Bell,
  Radio,
  BrainCircuit,
  AlertTriangle,
  Database,
  Search,
  Settings,
} from "lucide-react"

interface Notice {
  title: string
  date: string
  isNew?: boolean
}

const NOTICES: Notice[] = [
  { title: "정기 점검 안내 [2025년 6월]", date: "2025-05-22", isNew: true },
  { title: "AI 모델 업데이트 완료", date: "2025-05-21", isNew: true },
  { title: "안전 교육 일정 안내", date: "2025-05-20" },
  { title: "현장 설비 검사 시행 안내", date: "2025-05-19" },
  { title: "시스템 점검 안내", date: "2025-05-18" },
]

const DASHBOARDS = [
  { name: "BOP 대시보드", count: "대시보드 15개" },
  { name: "공정 통합 대시보드", count: "대시보드 5개" },
  { name: "테스트 대시보드", count: "대시보드 12개" },
  { name: "에너지 대시보드", count: "대시보드 1개" },
  { name: "울산 대시보드", count: "대시보드 5개" },
]

const QUICK_MENU = [
  { label: "즐겨찾기 / 알림", icon: Bell, href: "/alerts" },
  { label: "운전 공지", icon: Radio, href: "/help/notice" },
  { label: "AI/ML 모델 현황", icon: BrainCircuit, href: "/optimization/ai-ml" },
  { label: "공정 이상 알림", icon: AlertTriangle, href: "/alerts" },
  { label: "데이터 통합", icon: Database, href: "/admin" },
  { label: "문서 검색", icon: Search, href: "/knowledge/search" },
  { label: "대시보드 설정", icon: Settings, href: "/operations/custom-dashboard" },
]

export function HomeSidePanels() {
  const router = useRouter()

  return (
    <div className="space-y-4">
      {/* 공지사항 */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">공지사항</h2>
          </div>
          <button
            onClick={() => router.push("/help/notice")}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            전체 보기 <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <ul className="space-y-2.5">
          {NOTICES.map((n) => (
            <li key={n.title}>
              <button
                onClick={() => router.push("/help/notice")}
                className="w-full flex items-center justify-between gap-3 text-left group"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm text-foreground/80 group-hover:text-primary truncate">{n.title}</span>
                  {n.isNew && (
                    <Badge className="h-4 px-1 text-[9px] bg-primary text-primary-foreground border-0 flex-shrink-0">
                      N
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">{n.date}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {/* 대시보드 리스트 */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">대시보드 리스트</h2>
        </div>
        <ul className="space-y-1">
          {DASHBOARDS.map((d) => (
            <li key={d.name}>
              <button
                onClick={() => router.push("/operations/custom-dashboard")}
                className="w-full flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors group"
              >
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.count}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {/* 빠른 메뉴 */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">빠른 메뉴</h2>
        </div>
        <div className="grid grid-cols-1 gap-0.5">
          {QUICK_MENU.map((q) => {
            const Icon = q.icon
            return (
              <button
                key={q.label}
                onClick={() => router.push(q.href)}
                className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors text-left group"
              >
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                <span className="text-sm text-foreground/80 group-hover:text-foreground">{q.label}</span>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
