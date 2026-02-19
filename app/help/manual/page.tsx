"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen, Monitor, Bell, TrendingUp, Target, Database, Globe } from "lucide-react"
import Link from "next/link"

const MANUALS = [
  { title: "Operations 모니터링", desc: "실시간 운전 현황 모니터링 및 DCS 연동 가이드", icon: Monitor, href: "#" },
  { title: "Actions & 이벤트 관리", desc: "알람 관리, 이벤트 생성, Work Package 운영 가이드", icon: Bell, href: "#" },
  { title: "Optimization 분석", desc: "AI/ML 모델, What-if 시뮬레이션, Insight 분석 가이드", icon: TrendingUp, href: "#" },
  { title: "Workbench (TA/Scorpions)", desc: "TA Worklist 및 Scorpions 개선과제 관리 가이드", icon: Target, href: "#" },
  { title: "Data & Admin", desc: "데이터 품질 관리, Master Data, 시스템 설정 가이드", icon: Database, href: "#" },
  { title: "OOP Outside", desc: "3rd Party / 내부팀 분석 데이터 관리 가이드", icon: Globe, href: "#" },
]

export default function ManualPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">시스템 매뉴얼</h1>
          </div>
        </header>
        <main className="p-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-4">
            {MANUALS.map(m => {
              const Icon = m.icon
              return (
                <Link key={m.title} href={m.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{m.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{m.desc}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </main>
      </div>
    </AppShell>
  )
}
