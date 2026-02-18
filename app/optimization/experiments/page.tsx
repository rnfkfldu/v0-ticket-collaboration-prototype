"use client"

import React from "react"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Box, 
  Plus, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Cpu,
  Activity
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const EXPERIMENTS = [
  {
    id: "EXP-001",
    name: "HCR Reactor Temp Optimization",
    model: "AI/ML - Reactor Performance",
    status: "completed",
    created: "2025-01-28",
    creator: "김지수",
    description: "Reactor inlet temperature 최적 범위 탐색",
    parameters: 12,
    iterations: 500,
    bestScore: 0.94
  },
  {
    id: "EXP-002",
    name: "CCR Catalyst Cycle Length Prediction",
    model: "AI/ML - Catalyst Lifecycle",
    status: "running",
    created: "2025-02-01",
    creator: "박영호",
    description: "촉매 교체 주기 최적화 시뮬레이션",
    parameters: 8,
    iterations: 320,
    bestScore: 0.87
  },
  {
    id: "EXP-003",
    name: "CDU Energy Reduction Study",
    model: "RTO - CDU Energy Model",
    status: "draft",
    created: "2025-02-03",
    creator: "김지수",
    description: "CDU 에너지 절감 시나리오 비교",
    parameters: 6,
    iterations: 0,
    bestScore: null
  },
  {
    id: "EXP-004",
    name: "VDU Product Yield Improvement",
    model: "AI/ML - VDU Yield",
    status: "failed",
    created: "2025-01-20",
    creator: "이수진",
    description: "VDU 수율 개선 파라미터 조합 탐색",
    parameters: 15,
    iterations: 210,
    bestScore: null
  },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "완료", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  running: { label: "실행 중", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Play },
  draft: { label: "초안", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock },
  failed: { label: "실패", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
}

export default function ExperimentsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = EXPERIMENTS.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.model.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || e.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">Experiments (Model Sandbox)</h1>
            <p className="text-sm text-muted-foreground mt-1">모델 기반 실험을 생성하고 파라미터를 탐색합니다</p>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* 필터 바 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="실험명 또는 모델로 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {["all", "running", "completed", "draft", "failed"].map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className={statusFilter !== s ? "bg-transparent" : ""}
                >
                  {s === "all" ? "전체" : STATUS_CONFIG[s]?.label || s}
                </Button>
              ))}
            </div>
            <Button className="gap-2 ml-auto">
              <Plus className="h-4 w-4" />
              새 실험
            </Button>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold">{EXPERIMENTS.length}</div>
                <p className="text-sm text-muted-foreground">전체 실험</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-blue-600">{EXPERIMENTS.filter(e => e.status === "running").length}</div>
                <p className="text-sm text-muted-foreground">실행 중</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-green-600">{EXPERIMENTS.filter(e => e.status === "completed").length}</div>
                <p className="text-sm text-muted-foreground">완료</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-gray-500">{EXPERIMENTS.filter(e => e.status === "draft").length}</div>
                <p className="text-sm text-muted-foreground">초안</p>
              </CardContent>
            </Card>
          </div>

          {/* 실험 목록 */}
          <div className="space-y-3">
            {filtered.map(exp => {
              const statusCfg = STATUS_CONFIG[exp.status]
              const StatusIcon = statusCfg.icon
              return (
                <Card key={exp.id} className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Box className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{exp.name}</h3>
                          <Badge variant="outline" className={cn("text-xs", statusCfg.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{exp.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{exp.model}</span>
                          <span>Params: {exp.parameters}</span>
                          <span>Iterations: {exp.iterations}</span>
                          {exp.bestScore && <span className="text-green-600 font-medium">Best Score: {exp.bestScore}</span>}
                          <span>{exp.creator}</span>
                          <span>{exp.created}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exp.status === "draft" && (
                          <Button size="sm" className="gap-1"><Play className="h-3 w-3" />실행</Button>
                        )}
                        {exp.status === "running" && (
                          <Button size="sm" variant="outline" className="gap-1 bg-transparent"><Pause className="h-3 w-3" />중지</Button>
                        )}
                        <Button size="icon" variant="ghost"><Copy className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </main>
      </div>
    </AppShell>
  )
}
