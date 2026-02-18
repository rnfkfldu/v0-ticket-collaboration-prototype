"use client"

import React from "react"
import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"
import { KpiDimensionFilter, DEFAULT_KPI_DIMENSIONS, type KpiDimensions } from "@/components/kpi-dimension-filter"
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Timer,
  Inbox,
  BarChart3,
  Bell,
  FileText,
  ShieldAlert,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  XCircle,
  CircleCheck,
  CircleDot,
  Users,
  Activity,
} from "lucide-react"
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts"

// ---- Mock data ----
const MONTHS_6 = ["8월", "9월", "10월", "11월", "12월", "1월"]

// Ticket health metrics
const ticketMetrics = {
  totalOpen: 23,
  overdue: 7,
  avgResolutionDays: 12.4,
  avgResolutionPrev: 14.1,
  closedThisMonth: 18,
  closedPrev: 15,
  createdThisMonth: 21,
  createdPrev: 19,
  slaCompliance: 78,
  slaPrev: 72,
}

const ticketByStatus = [
  { name: "Open", value: 8, color: "hsl(var(--primary))" },
  { name: "In Progress", value: 10, color: "hsl(210, 70%, 55%)" },
  { name: "Review", value: 5, color: "hsl(45, 90%, 50%)" },
  { name: "Overdue", value: 7, color: "hsl(0, 70%, 55%)" },
]

const ticketByCategory = [
  { name: "개선", value: 9, color: "hsl(210, 70%, 55%)" },
  { name: "트러블", value: 5, color: "hsl(25, 90%, 55%)" },
  { name: "변경", value: 3, color: "hsl(45, 90%, 50%)" },
  { name: "분석", value: 4, color: "hsl(150, 60%, 45%)" },
  { name: "모델개선", value: 3, color: "hsl(270, 60%, 55%)" },
  { name: "실공정테스트", value: 3, color: "hsl(180, 60%, 45%)" },
]

const ticketTrend = MONTHS_6.map((m, i) => ({
  month: m,
  created: 15 + Math.floor(Math.random() * 8),
  closed: 13 + Math.floor(Math.random() * 8),
  overdue: 8 - i + Math.floor(Math.random() * 3),
}))

const avgResolutionTrend = MONTHS_6.map((m, i) => ({
  month: m,
  days: 18 - i * 1.2 + Math.random() * 2,
}))

// Alarm governance metrics
const alarmMetrics = {
  totalActive: 34,
  shelved: 12,
  shelvedPrev: 15,
  standing: 8,
  standingPrev: 11,
  avgPerDay: 4.2,
  avgPerDayPrev: 5.8,
  rationalizationRate: 82,
  rationalizationPrev: 76,
}

const alarmByPriority = [
  { priority: "Critical", count: 3, color: "hsl(0, 70%, 55%)" },
  { priority: "High", count: 8, color: "hsl(25, 90%, 55%)" },
  { priority: "Medium", count: 14, color: "hsl(45, 90%, 50%)" },
  { priority: "Low", count: 9, color: "hsl(210, 70%, 55%)" },
]

const alarmTrend = MONTHS_6.map((m, i) => ({
  month: m,
  active: 45 - i * 2 + Math.floor(Math.random() * 5),
  shelved: 18 - i + Math.floor(Math.random() * 3),
  standing: 14 - i + Math.floor(Math.random() * 2),
}))

// Overall system governance scores
const governanceScores = [
  { category: "티켓 처리 속도", score: 78, target: 85, trend: "up" as const },
  { category: "알람 Rationalization", score: 82, target: 80, trend: "up" as const },
  { category: "Shelved Alarm 관리", score: 65, target: 75, trend: "up" as const },
  { category: "Standing Alarm 해소율", score: 71, target: 80, trend: "down" as const },
  { category: "SLA 준수율", score: 78, target: 85, trend: "up" as const },
  { category: "Follow-Up 이행률", score: 88, target: 90, trend: "up" as const },
]

// Overdue ticket details
const overdueTickets = [
  { id: "T-001", title: "HCR Reactor dT 불균형 분석", owner: "김지수", daysOverdue: 12, priority: "P1" },
  { id: "T-003", title: "VDU Standing Alarm 해소 방안", owner: "박영수", daysOverdue: 8, priority: "P2" },
  { id: "T-005", title: "CDU Preheater Fouling 대응 계획", owner: "이민호", daysOverdue: 5, priority: "P2" },
  { id: "T-008", title: "CCR APC 가동 요청 이관", owner: "김지수", daysOverdue: 3, priority: "P1" },
  { id: "T-012", title: "전사 Energy Index 과제 Pool", owner: "김지수", daysOverdue: 2, priority: "P3" },
  { id: "T-015", title: "HDS 촉매 성능 평가 보고서", owner: "이민호", daysOverdue: 1, priority: "P3" },
  { id: "T-019", title: "RFCC Riser Temp 편차 원인 분석", owner: "박영수", daysOverdue: 1, priority: "P2" },
]

// Team workload
const teamWorkload = [
  { name: "김지수", open: 6, inProgress: 3, overdue: 3, avgDays: 10.2 },
  { name: "이민호", open: 4, inProgress: 4, overdue: 2, avgDays: 13.5 },
  { name: "박영수", open: 3, inProgress: 2, overdue: 2, avgDays: 11.8 },
  { name: "최영진", open: 2, inProgress: 1, overdue: 0, avgDays: 8.4 },
]

function MetricCard({ label, value, unit, prev, prevLabel, flip, icon: Icon, color }: {
  label: string; value: number; unit: string; prev: number; prevLabel?: string; flip?: boolean
  icon: React.ElementType; color: string
}) {
  const delta = value - prev
  const isGood = flip ? delta < 0 : delta > 0
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></p>
          </div>
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", color)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Math.abs(delta) < 0.05 ? (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> 변동 없음</span>
          ) : (
            <span className={cn("text-xs flex items-center gap-0.5", isGood ? "text-green-600" : "text-red-600")}>
              {isGood ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta > 0 ? "+" : ""}{Number.isInteger(delta) ? delta : delta.toFixed(1)}{unit} {prevLabel || "전월비"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreBar({ score, target }: { score: number; target: number }) {
  const met = score >= target
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden relative">
        <div
          className={cn("h-full rounded-full transition-all", met ? "bg-green-500" : "bg-amber-500")}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
          style={{ left: `${target}%` }}
        />
      </div>
      <span className={cn("text-sm font-mono font-medium w-10 text-right", met ? "text-green-600" : "text-amber-600")}>{score}%</span>
    </div>
  )
}

export default function SystemHealthReviewPage() {
  const { scopeMode, currentUser } = useUser()
  const [activeTab, setActiveTab] = useState("governance")
  const [kpiDimensions, setKpiDimensions] = useState<KpiDimensions>(DEFAULT_KPI_DIMENSIONS)

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground text-balance">System Health Review</h1>
  <p className="text-sm text-muted-foreground">
  업무 거버넌스 현황 - 티켓 처리, 알람 관리, SLA 준수율 등
  </p>
  <div className="mt-3">
    <KpiDimensionFilter dimensions={kpiDimensions} onChange={setKpiDimensions} />
  </div>
  </div>
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              기준일: 2025-02-04
            </Badge>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="governance">Governance Score</TabsTrigger>
              <TabsTrigger value="tickets">Ticket Health</TabsTrigger>
              <TabsTrigger value="alarms">Alarm Governance</TabsTrigger>
              <TabsTrigger value="workload">Team Workload</TabsTrigger>
            </TabsList>

            {/* Governance Score Tab */}
            <TabsContent value="governance" className="space-y-6">
              {/* Overall score card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    거버넌스 종합 스코어
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {governanceScores.map((item) => (
                    <div key={item.category} className="flex items-center gap-4">
                      <div className="w-44 flex items-center gap-2 flex-shrink-0">
                        <div className={cn("w-1.5 h-1.5 rounded-full",
                          item.score >= item.target ? "bg-green-500" : "bg-amber-500"
                        )} />
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <ScoreBar score={item.score} target={item.target} />
                      <div className="flex items-center gap-1 w-16 flex-shrink-0 justify-end">
                        {item.trend === "up" ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                        <span className="text-xs text-muted-foreground">T:{item.target}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Overdue 티켓" value={ticketMetrics.overdue} unit="건" prev={10} flip icon={XCircle} color="bg-red-100 text-red-600" />
                <MetricCard label="Shelved Alarm" value={alarmMetrics.shelved} unit="건" prev={alarmMetrics.shelvedPrev} flip icon={Bell} color="bg-amber-100 text-amber-600" />
                <MetricCard label="Standing Alarm" value={alarmMetrics.standing} unit="건" prev={alarmMetrics.standingPrev} flip icon={AlertTriangle} color="bg-orange-100 text-orange-600" />
                <MetricCard label="SLA 준수율" value={ticketMetrics.slaCompliance} unit="%" prev={ticketMetrics.slaPrev} icon={CheckCircle} color="bg-green-100 text-green-600" />
              </div>

              {/* Dual chart */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">평균 티켓 처리 일수 (6개월)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={avgResolutionTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip formatter={(v: number) => `${v.toFixed(1)}일`} />
                          <Line type="monotone" dataKey="days" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="평균 처리일" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">알람 현황 추이 (6개월)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={alarmTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="active" stroke="hsl(var(--primary))" strokeWidth={2} name="Active" dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="shelved" stroke="hsl(45, 90%, 50%)" strokeWidth={2} name="Shelved" dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="standing" stroke="hsl(0, 70%, 55%)" strokeWidth={2} name="Standing" dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Ticket Health Tab */}
            <TabsContent value="tickets" className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard label="Open 티켓" value={ticketMetrics.totalOpen} unit="건" prev={25} flip icon={Inbox} color="bg-blue-100 text-blue-600" />
                <MetricCard label="Overdue" value={ticketMetrics.overdue} unit="건" prev={10} flip icon={XCircle} color="bg-red-100 text-red-600" />
                <MetricCard label="평균 처리 일수" value={ticketMetrics.avgResolutionDays} unit="일" prev={ticketMetrics.avgResolutionPrev} flip icon={Timer} color="bg-emerald-100 text-emerald-600" />
                <MetricCard label="금월 완료" value={ticketMetrics.closedThisMonth} unit="건" prev={ticketMetrics.closedPrev} icon={CheckCircle} color="bg-green-100 text-green-600" />
                <MetricCard label="SLA 준수율" value={ticketMetrics.slaCompliance} unit="%" prev={ticketMetrics.slaPrev} icon={Target} color="bg-primary/10 text-primary" />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">상태별 분포</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={ticketByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="name" label={({name, value}) => `${name}: ${value}`}>
                            {ticketByStatus.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">분류별 분포</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ticketByCategory} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip />
                          <Bar dataKey="value" radius={[0,4,4,0]}>
                            {ticketByCategory.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">생성/완료 추이</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ticketTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="created" name="생성" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} />
                          <Bar dataKey="closed" name="완료" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Overdue tickets list */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Overdue 티켓 목록
                    <Badge variant="destructive" className="text-xs ml-1">{overdueTickets.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[80px_1fr_100px_100px_80px] bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                      <span>ID</span>
                      <span>제목</span>
                      <span>담당자</span>
                      <span>지연 일수</span>
                      <span>우선순위</span>
                    </div>
                    {overdueTickets.map((ticket) => (
                      <div key={ticket.id} className="grid grid-cols-[80px_1fr_100px_100px_80px] px-4 py-2.5 text-sm border-b last:border-0 items-center hover:bg-red-50/50">
                        <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                        <span>{ticket.title}</span>
                        <span className="text-muted-foreground text-xs">{ticket.owner}</span>
                        <span className="text-red-600 font-medium text-xs">+{ticket.daysOverdue}일</span>
                        <Badge variant="outline" className={cn("text-xs w-fit",
                          ticket.priority === "P1" ? "text-red-600 border-red-300" :
                          ticket.priority === "P2" ? "text-amber-600 border-amber-300" :
                          "text-muted-foreground"
                        )}>{ticket.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alarm Governance Tab */}
            <TabsContent value="alarms" className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Active Alarm" value={alarmMetrics.totalActive} unit="건" prev={42} flip icon={Bell} color="bg-blue-100 text-blue-600" />
                <MetricCard label="Shelved Alarm" value={alarmMetrics.shelved} unit="건" prev={alarmMetrics.shelvedPrev} flip icon={AlertTriangle} color="bg-amber-100 text-amber-600" />
                <MetricCard label="Standing Alarm" value={alarmMetrics.standing} unit="건" prev={alarmMetrics.standingPrev} flip icon={Clock} color="bg-orange-100 text-orange-600" />
                <MetricCard label="일평균 알람 수" value={alarmMetrics.avgPerDay} unit="건/일" prev={alarmMetrics.avgPerDayPrev} flip icon={Activity} color="bg-emerald-100 text-emerald-600" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">알람 등급별 분포</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {alarmByPriority.map((item) => (
                        <div key={item.priority} className="flex items-center gap-3">
                          <span className="text-sm w-16 flex-shrink-0">{item.priority}</span>
                          <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                            <div className="h-full rounded-md flex items-center px-2" style={{ width: `${(item.count / 34) * 100}%`, backgroundColor: item.color }}>
                              <span className="text-xs font-medium text-white">{item.count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Alarm Rationalization</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">Rationalization Rate</p>
                        <div className="flex items-end gap-2 mb-3">
                          <span className="text-3xl font-bold">{alarmMetrics.rationalizationRate}%</span>
                          <span className={cn("text-sm flex items-center gap-0.5 mb-1",
                            alarmMetrics.rationalizationRate > alarmMetrics.rationalizationPrev ? "text-green-600" : "text-red-600"
                          )}>
                            <ArrowUpRight className="h-3 w-3" />
                            +{alarmMetrics.rationalizationRate - alarmMetrics.rationalizationPrev}%
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${alarmMetrics.rationalizationRate}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Target: 80%</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CircleCheck className="h-4 w-4 text-green-500" />
                          <span>Rationalized: {Math.round(34 * alarmMetrics.rationalizationRate / 100)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CircleDot className="h-4 w-4 text-amber-500" />
                          <span>Pending: {34 - Math.round(34 * alarmMetrics.rationalizationRate / 100)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Shelved alarm details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Shelved Alarm 상세 (장기 보류)
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 ml-1">{alarmMetrics.shelved}건</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[100px_120px_1fr_100px_100px] bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                      <span>Tag ID</span>
                      <span>Unit</span>
                      <span>설명</span>
                      <span>Shelved 일수</span>
                      <span>사유</span>
                    </div>
                    {[
                      { tag: "PI-2305", unit: "HCR", desc: "2nd Bed dP High Alarm", days: 45, reason: "계기 점검 대기" },
                      { tag: "TI-1502", unit: "VDU", desc: "Column Top Temp Low", days: 32, reason: "Set-point 재설정 중" },
                      { tag: "FI-1103", unit: "CDU", desc: "Feed Flow Low Alarm", days: 28, reason: "운전범위 변경 검토" },
                      { tag: "LI-4201", unit: "CCR", desc: "Separator Level High", days: 21, reason: "계기 교체 발주 중" },
                      { tag: "AI-3102", unit: "HDS", desc: "H2S Analyzer Fault", days: 18, reason: "분석기 보정 대기" },
                    ].map((item) => (
                      <div key={item.tag} className="grid grid-cols-[100px_120px_1fr_100px_100px] px-4 py-2.5 text-sm border-b last:border-0 items-center hover:bg-muted/30">
                        <span className="font-mono text-xs">{item.tag}</span>
                        <Badge variant="outline" className="text-xs w-fit">{item.unit}</Badge>
                        <span className="text-xs">{item.desc}</span>
                        <span className={cn("font-mono text-xs", item.days > 30 ? "text-red-600 font-medium" : "text-amber-600")}>{item.days}일</span>
                        <span className="text-xs text-muted-foreground">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Workload Tab */}
            <TabsContent value="workload" className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    팀원별 업무 부하 현황
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[120px_80px_100px_80px_100px_1fr] bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground border-b">
                      <span>담당자</span>
                      <span>Open</span>
                      <span>In Progress</span>
                      <span>Overdue</span>
                      <span>평균 처리일</span>
                      <span>업무 부하</span>
                    </div>
                    {teamWorkload.map((member) => {
                      const total = member.open + member.inProgress
                      const loadPct = Math.min(total / 12 * 100, 100)
                      return (
                        <div key={member.name} className="grid grid-cols-[120px_80px_100px_80px_100px_1fr] px-4 py-3 text-sm border-b last:border-0 items-center">
                          <span className="font-medium">{member.name}</span>
                          <span className="font-mono text-xs">{member.open}</span>
                          <span className="font-mono text-xs">{member.inProgress}</span>
                          <span className={cn("font-mono text-xs", member.overdue > 0 ? "text-red-600 font-medium" : "text-muted-foreground")}>
                            {member.overdue}
                          </span>
                          <span className="font-mono text-xs">{member.avgDays}일</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full",
                                  loadPct > 75 ? "bg-red-500" : loadPct > 50 ? "bg-amber-500" : "bg-green-500"
                                )}
                                style={{ width: `${loadPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{total}건</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Workload chart */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">팀원별 티켓 분포</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamWorkload} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="open" stackId="a" name="Open" fill="hsl(var(--primary))" radius={0} />
                        <Bar dataKey="inProgress" stackId="a" name="In Progress" fill="hsl(210, 70%, 55%)" radius={0} />
                        <Bar dataKey="overdue" stackId="a" name="Overdue" fill="hsl(0, 70%, 55%)" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppShell>
  )
}
