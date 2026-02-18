"use client"

import React from "react"
import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useUser, getProcessesByDivision, type Division } from "@/lib/user-context"
import { KpiDimensionFilter, DEFAULT_KPI_DIMENSIONS, type KpiDimensions } from "@/components/kpi-dimension-filter"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle,
  Flame,
  ThermometerSun,
  Zap,
  Droplets,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calendar,
  ChevronRight,
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts"

// --- Monthly KPI summary data ---
const MONTHS = ["2024-08","2024-09","2024-10","2024-11","2024-12","2025-01"]
const MONTH_LABELS = ["8월","9월","10월","11월","12월","1월"]

function genTrend(base: number, volatility: number) {
  return MONTHS.map((m, i) => ({
    month: MONTH_LABELS[i],
    value: Math.round((base + (Math.random() - 0.4) * volatility + i * 0.3) * 10) / 10
  }))
}

interface UnitMonthlyData {
  unit: string
  division: Division
  throughput: { current: number; prev: number; target: number }
  energyIndex: { current: number; prev: number; target: number }
  yield: { current: number; prev: number; target: number }
  alarmCount: { current: number; prev: number }
  ticketsClosed: { current: number; prev: number }
  longTermHealth: "good" | "watch" | "critical"
  highlights: string[]
  trend: { month: string; throughput: number; energy: number; yield: number }[]
}

function generateUnitData(id: string, name: string, div: Division): UnitMonthlyData {
  const h = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const healthOptions = ["good", "good", "watch", "critical"] as const
  return {
    unit: name,
    division: div,
    throughput: { current: 90 + (h % 10), prev: 89 + (h % 8), target: 95 },
    energyIndex: { current: 95 + (h % 6), prev: 96 + (h % 5), target: 100 },
    yield: { current: 85 + (h % 12), prev: 84 + (h % 10), target: 90 },
    alarmCount: { current: (h % 8), prev: (h % 12) + 1 },
    ticketsClosed: { current: (h % 5) + 2, prev: (h % 4) + 1 },
    longTermHealth: healthOptions[h % healthOptions.length],
    highlights: h % 3 === 0
      ? ["Fouling 진행 주의 - Heater Efficiency 하락 추세"]
      : h % 3 === 1
        ? ["촉매 성능 안정", "Energy Index 개선 (전월비 -1.2%)"]
        : ["Throughput 목표 달성", "Standing Alarm 2건 해소"],
    trend: MONTH_LABELS.map((m, i) => ({
      month: m,
      throughput: 88 + (h % 8) + i * 0.5 + Math.random() * 2,
      energy: 94 + (h % 5) + i * 0.3 + Math.random() * 1.5,
      yield: 83 + (h % 10) + i * 0.4 + Math.random() * 2,
    }))
  }
}

// Plant-level KPI data
const plantKpi = {
  throughput: genTrend(96, 3),
  energyIndex: genTrend(97, 2),
  yield: genTrend(91, 4),
  alarms: MONTH_LABELS.map((m, i) => ({ month: m, value: 25 - i * 2 + Math.floor(Math.random() * 5) })),
  tickets: MONTH_LABELS.map((m, i) => ({ month: m, opened: 12 + Math.floor(Math.random() * 5), closed: 10 + Math.floor(Math.random() * 6) })),
}

function DeltaBadge({ current, prev, suffix = "", flip = false }: { current: number; prev: number; suffix?: string; flip?: boolean }) {
  const delta = current - prev
  const isGood = flip ? delta < 0 : delta > 0
  if (Math.abs(delta) < 0.05) return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> 변동 없음</span>
  return (
    <span className={cn("text-xs flex items-center gap-0.5", isGood ? "text-green-600" : "text-red-600")}>
      {isGood ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {delta > 0 ? "+" : ""}{delta.toFixed(1)}{suffix}
    </span>
  )
}

function KpiSummaryCard({ label, value, unit, delta, deltaPrev, target, icon: Icon, color }: {
  label: string; value: number; unit: string; delta: number; deltaPrev: number; target: number
  icon: React.ElementType; color: string
}) {
  const atTarget = value >= target
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></p>
          </div>
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <DeltaBadge current={value} prev={deltaPrev} suffix={unit} />
          <Badge variant={atTarget ? "default" : "outline"} className={cn("text-xs", !atTarget && "text-amber-600 border-amber-300")}>
            Target: {target}{unit}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MonthlyReviewPage() {
  const { visibleProcesses, scopeMode, currentUser } = useUser()
  const [selectedMonth, setSelectedMonth] = useState("2025-01")
  const [selectedDivision, setSelectedDivision] = useState<"all" | Division>("all")
  const [activeTab, setActiveTab] = useState("overview")
  const [kpiDimensions, setKpiDimensions] = useState<KpiDimensions>(DEFAULT_KPI_DIMENSIONS)

  const byDivision = getProcessesByDivision(visibleProcesses)

  const allUnits: UnitMonthlyData[] = visibleProcesses.map(p => generateUnitData(p.id, p.name, p.division))

  const filteredUnits = selectedDivision === "all"
    ? allUnits
    : allUnits.filter(u => u.division === selectedDivision)

  // Aggregate stats
  const avgThroughput = filteredUnits.length > 0 ? filteredUnits.reduce((s, u) => s + u.throughput.current, 0) / filteredUnits.length : 0
  const avgEnergy = filteredUnits.length > 0 ? filteredUnits.reduce((s, u) => s + u.energyIndex.current, 0) / filteredUnits.length : 0
  const avgYield = filteredUnits.length > 0 ? filteredUnits.reduce((s, u) => s + u.yield.current, 0) / filteredUnits.length : 0
  const totalAlarms = filteredUnits.reduce((s, u) => s + u.alarmCount.current, 0)
  const prevAlarms = filteredUnits.reduce((s, u) => s + u.alarmCount.prev, 0)
  const watchCount = filteredUnits.filter(u => u.longTermHealth === "watch").length
  const criticalCount = filteredUnits.filter(u => u.longTermHealth === "critical").length

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground text-balance">Monthly Operation Review</h1>
  <p className="text-sm text-muted-foreground">월간 운전 실적 리뷰</p>
  </div>
            <div className="flex items-center gap-3">
              <Select value={selectedDivision} onValueChange={(v) => setSelectedDivision(v as "all" | Division)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 부문</SelectItem>
                  <SelectItem value="Refining">Refining</SelectItem>
                  <SelectItem value="Chemical">Chemical</SelectItem>
                  <SelectItem value="Upgrading">Upgrading</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-01">2025년 1월</SelectItem>
                  <SelectItem value="2024-12">2024년 12월</SelectItem>
                  <SelectItem value="2024-11">2024년 11월</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

  <main className="flex-1 overflow-auto p-6">
  <div className="mb-4 p-3 bg-muted/30 border rounded-lg">
    <KpiDimensionFilter dimensions={kpiDimensions} onChange={setKpiDimensions} />
  </div>
  <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Plant Overview</TabsTrigger>
              <TabsTrigger value="unit-detail">Unit Detail</TabsTrigger>
              <TabsTrigger value="issues">Issues & Actions</TabsTrigger>
            </TabsList>

            {/* Tab 1: Plant Overview */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiSummaryCard
                  label="평균 가동률" value={avgThroughput} unit="%" delta={avgThroughput - 95} deltaPrev={avgThroughput - 1.2} target={95}
                  icon={Activity} color="bg-blue-100 text-blue-600"
                />
                <KpiSummaryCard
                  label="Energy Index" value={avgEnergy} unit="" delta={avgEnergy - 100} deltaPrev={avgEnergy + 0.8} target={100}
                  icon={Zap} color="bg-amber-100 text-amber-600"
                />
                <KpiSummaryCard
                  label="평균 수율" value={avgYield} unit="%" delta={avgYield - 90} deltaPrev={avgYield - 0.5} target={90}
                  icon={Droplets} color="bg-emerald-100 text-emerald-600"
                />
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">총 알람 건수</p>
                        <p className="text-2xl font-bold">{totalAlarms}<span className="text-sm font-normal text-muted-foreground ml-1">건</span></p>
                      </div>
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-red-100 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    </div>
                    <DeltaBadge current={totalAlarms} prev={prevAlarms} suffix="건" flip />
                  </CardContent>
                </Card>
              </div>

              {/* Long-Term Health Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Long-Term Health 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Good</p>
                        <p className="text-2xl font-bold text-green-700">{filteredUnits.length - watchCount - criticalCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Watch</p>
                        <p className="text-2xl font-bold text-amber-700">{watchCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                      <Flame className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Critical</p>
                        <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plant-level trends */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">가동률 추이 (6개월)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={plantKpi.throughput}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">알람 건수 추이 (6개월)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={plantKpi.alarms}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ticket throughput */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">티켓 처리 현황 (6개월)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={plantKpi.tickets}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="opened" name="생성" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} />
                        <Bar dataKey="closed" name="완료" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Unit Detail */}
            <TabsContent value="unit-detail" className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[140px_90px_90px_90px_90px_70px_70px_90px_1fr] bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground border-b gap-2">
                  <span>Unit</span>
                  <span>부문</span>
                  <span>가동률</span>
                  <span>Energy Idx</span>
                  <span>수율</span>
                  <span>Alarm</span>
                  <span>Tickets</span>
                  <span>LT Health</span>
                  <span>Highlights</span>
                </div>
                <div className="max-h-[520px] overflow-y-auto">
                  {filteredUnits.map((unit) => (
                    <div
                      key={unit.unit}
                      className="grid grid-cols-[140px_90px_90px_90px_90px_70px_70px_90px_1fr] px-4 py-3 text-sm border-b last:border-0 items-center gap-2 hover:bg-muted/30"
                    >
                      <span className="font-medium">{unit.unit}</span>
                      <span className="text-xs text-muted-foreground">{unit.division}</span>
                      <div>
                        <span className="font-mono text-xs">{unit.throughput.current}%</span>
                        <DeltaBadge current={unit.throughput.current} prev={unit.throughput.prev} suffix="%" />
                      </div>
                      <div>
                        <span className="font-mono text-xs">{unit.energyIndex.current}</span>
                        <DeltaBadge current={unit.energyIndex.current} prev={unit.energyIndex.prev} flip />
                      </div>
                      <div>
                        <span className="font-mono text-xs">{unit.yield.current}%</span>
                        <DeltaBadge current={unit.yield.current} prev={unit.yield.prev} suffix="%" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn("font-mono text-xs", unit.alarmCount.current > 5 ? "text-red-600 font-medium" : "")}>{unit.alarmCount.current}</span>
                        {unit.alarmCount.current < unit.alarmCount.prev ? (
                          <TrendingDown className="h-3 w-3 text-green-500" />
                        ) : unit.alarmCount.current > unit.alarmCount.prev ? (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        ) : null}
                      </div>
                      <span className="font-mono text-xs">{unit.ticketsClosed.current}</span>
                      <Badge variant="outline" className={cn("text-xs w-fit",
                        unit.longTermHealth === "good" ? "text-green-600 border-green-300" :
                        unit.longTermHealth === "watch" ? "text-amber-600 border-amber-300" :
                        "text-red-600 border-red-300"
                      )}>
                        {unit.longTermHealth === "good" ? "Good" : unit.longTermHealth === "watch" ? "Watch" : "Critical"}
                      </Badge>
                      <div className="space-y-0.5">
                        {unit.highlights.map((h, i) => (
                          <p key={i} className="text-xs text-muted-foreground leading-tight">{h}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Issues & Actions */}
            <TabsContent value="issues" className="space-y-6">
              {/* Recurring issues */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    주요 현안 사항
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { unit: "HCR", issue: "Reactor Bed 간 dT 불균형 지속 - Quench 배분 최적화 테스트 진행 중", priority: "P1", status: "In Progress" },
                    { unit: "CDU", issue: "Preheater Fouling 진행 (효율 2.3% 하락) - 다음 T/A 시 Chemical Cleaning 예정", priority: "P2", status: "Planned" },
                    { unit: "VDU", issue: "Column Top 온도 편차 발생 빈도 증가 - 계기 점검 완료, 운전 가이드 조정 중", priority: "P2", status: "In Progress" },
                    { unit: "CCR", issue: "Catalyst Coke 비율 점진적 상승 추세 - 6개월 내 촉매 교체 검토 필요", priority: "P3", status: "Monitoring" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 border rounded-lg">
                      <Badge variant="outline" className="mt-0.5 flex-shrink-0 text-xs">{item.unit}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.issue}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">{item.priority}</Badge>
                        <Badge variant="outline" className={cn("text-xs",
                          item.status === "In Progress" ? "text-blue-600 border-blue-300" :
                          item.status === "Planned" ? "text-amber-600 border-amber-300" :
                          "text-muted-foreground"
                        )}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Action Items from last month */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    전월 Follow-Up 이행 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { action: "HCR Quench 분배 비율 테스트 완료 후 결과 공유", assignee: "김지수", status: "done" },
                    { action: "CDU Desalter Wash Water 최적 비율 확정", assignee: "이민호", status: "done" },
                    { action: "VDU Standing Alarm 2건 해소 방안 수립", assignee: "박영수", status: "done" },
                    { action: "전사 Energy Index 개선 과제 Pool 작성", assignee: "김지수", status: "pending" },
                    { action: "CCR 촉매 교체 시기 검토 보고서 작성", assignee: "이민호", status: "carryover" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 border rounded-lg">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                        item.status === "done" ? "bg-green-100" : item.status === "pending" ? "bg-amber-100" : "bg-red-100"
                      )}>
                        {item.status === "done" ? <CheckCircle className="h-3 w-3 text-green-600" /> :
                         item.status === "pending" ? <Calendar className="h-3 w-3 text-amber-600" /> :
                         <ChevronRight className="h-3 w-3 text-red-600" />}
                      </div>
                      <p className="text-sm flex-1">{item.action}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{item.assignee}</span>
                      <Badge variant="outline" className={cn("text-xs",
                        item.status === "done" ? "text-green-600 border-green-300" :
                        item.status === "pending" ? "text-amber-600 border-amber-300" :
                        "text-red-600 border-red-300"
                      )}>
                        {item.status === "done" ? "완료" : item.status === "pending" ? "진행중" : "Carryover"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Next month actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    금월 Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { action: "HCR Quench 테스트 결과 기반 운전 가이드 확정", assignee: "김지수", dueDate: "2025-02-15" },
                    { action: "CDU Preheater Chemical Cleaning 예산 확보", assignee: "이민호", dueDate: "2025-02-20" },
                    { action: "CCR 촉매 교체 시기 검토 보고서 작성 (Carryover)", assignee: "이민호", dueDate: "2025-02-28" },
                    { action: "전사 Energy Index 개선 과제 Pool 작성 (Carryover)", assignee: "김지수", dueDate: "2025-02-28" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 border rounded-lg">
                      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{item.dueDate}</span>
                      <p className="text-sm flex-1">{item.action}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{item.assignee}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppShell>
  )
}
